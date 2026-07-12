import { ProxyAgent, setGlobalDispatcher } from 'undici';
import net from 'net';
import { Duplex } from 'stream';

// 仅在本地开发模式且显式配置了 DEV_PROXY 时才开启全局 Fetch 代理
const proxyUrl = process.env.DEV_PROXY;

if (process.env.NODE_ENV === 'development' && proxyUrl) {
  try {
    const proxyAgent = new ProxyAgent(proxyUrl);
    setGlobalDispatcher(proxyAgent);
    console.log(`[Dev Proxy] Node.js global fetch dispatcher set to: ${proxyUrl}`);
  } catch (error) {
    console.error('[Dev Proxy] Failed to set global fetch dispatcher:', error);
  }
}

/**
 * 自定义 pg 数据库连接代理流
 * 优先通过本地配置的代理 CONNECT 隧道进行转发。
 * 修复：Duplex 必须继承或代理 net.Socket 所需的各种属性/方法（如 setNoDelay 等）。
 */
export function createProxiedStream(config: any) {
  const proxyUrl = process.env.DEV_PROXY;
  
  // 如果没有配置代理，直接使用标准 net.connect
  if (!proxyUrl) {
    return net.connect(config.port, config.host);
  }

  let proxyHost = '127.0.0.1';
  let proxyPort = 7890;
  try {
    const url = new URL(proxyUrl);
    proxyHost = url.hostname;
    proxyPort = parseInt(url.port) || 80;
  } catch (e) {
    return net.connect(config.port, config.host);
  }

  // 这里的 socket 我们需要直接暴露 pg 客户端所需的方法，因此最好用 net.Socket 子类或直接在创建时覆写方法
  const pgStream: any = new Duplex({
    read(size) {},
    write(chunk, encoding, callback) {
      if (proxySocket && connected) {
        proxySocket.write(chunk, encoding, callback);
      } else {
        bufferedWrites.push({ chunk, encoding, callback });
      }
    }
  });

  // 垫片方法，满足 pg 驱动对网络 Socket 的调用
  pgStream.setNoDelay = function(noDelay?: boolean) {
    if (proxySocket && typeof proxySocket.setNoDelay === 'function') {
      proxySocket.setNoDelay(noDelay);
    }
    return this;
  };

  pgStream.setKeepAlive = function(enable?: boolean, initialDelay?: number) {
    if (proxySocket && typeof proxySocket.setKeepAlive === 'function') {
      proxySocket.setKeepAlive(enable, initialDelay);
    }
    return this;
  };

  pgStream.ref = function() {
    if (proxySocket && typeof proxySocket.ref === 'function') {
      proxySocket.ref();
    }
    return this;
  };

  pgStream.unref = function() {
    if (proxySocket && typeof proxySocket.unref === 'function') {
      proxySocket.unref();
    }
    return this;
  };

  const bufferedWrites: any[] = [];
  let proxySocket: net.Socket | null = null;
  let connected = false;

  const targetHost = config.host;
  const targetPort = config.port;

  // 连接代理服务器
  proxySocket = net.connect(proxyPort, proxyHost);

  proxySocket.on('connect', () => {
    proxySocket!.write(`CONNECT ${targetHost}:${targetPort} HTTP/1.1\r\nHost: ${targetHost}:${targetPort}\r\n\r\n`);
  });

  proxySocket.on('data', (chunk) => {
    if (!connected) {
      const response = chunk.toString();
      if (response.includes('200')) {
        connected = true;
        const headerEnd = chunk.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          const remaining = chunk.subarray(headerEnd + 4);
          if (remaining.length > 0) {
            pgStream.push(remaining);
          }
        }

        proxySocket!.on('data', (data) => {
          pgStream.push(data);
        });

        for (const w of bufferedWrites) {
          proxySocket!.write(w.chunk, w.encoding, w.callback);
        }
        bufferedWrites.length = 0;

        pgStream.emit('connect');
      } else {
        pgStream.emit('error', new Error('Proxy CONNECT failed: ' + response));
      }
    }
  });

  proxySocket.on('error', (err) => {
    // 代理连接失败（如端口未开放、Clash 未开启），立即尝试退回到直连
    if (!connected && (err.message.includes('ECONNREFUSED') || err.message.includes('timeout'))) {
      console.log(`[Dev Proxy] Proxy connection refused. Falling back to direct connection to ${targetHost}:${targetPort}`);
      proxySocket!.destroy();
      
      const directSocket = net.connect(targetPort, targetHost, () => {
        connected = true;
        
        directSocket.on('data', (data) => {
          pgStream.push(data);
        });

        for (const w of bufferedWrites) {
          directSocket.write(w.chunk, w.encoding, w.callback);
        }
        bufferedWrites.length = 0;

        pgStream.emit('connect');
      });

      directSocket.on('error', (directErr) => {
        pgStream.emit('error', directErr);
      });

      directSocket.on('close', () => {
        pgStream.push(null);
      });

      proxySocket = directSocket;
    } else {
      pgStream.emit('error', err);
    }
  });

  proxySocket.on('close', () => {
    if (connected) {
      pgStream.push(null);
    }
  });

  pgStream.on('error', (err: any) => {
    if (proxySocket) proxySocket.destroy();
  });

  return pgStream;
}
