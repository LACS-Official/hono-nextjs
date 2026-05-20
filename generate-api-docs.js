const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'app', 'api');
const outputFile = path.join(__dirname, 'api-data.json');

const apiData = [];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('route.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(apiDir);

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  
  // 提取相对路径
  let relativePath = file.replace(apiDir, '').replace(/\\/g, '/').replace(/\/route\.ts$/, '');
  if (!relativePath) relativePath = '/';
  const apiPath = `/api${relativePath}`;

  // 提取HTTP方法
  const methods = [];
  ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].forEach(m => {
    if (content.includes(`export async function ${m}`)) {
      methods.push(m);
    }
  });

  // 提取头部注释
  let description = "暂无描述";
  const commentMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
  if (commentMatch) {
    const commentLines = commentMatch[1].split('\n')
      .map(line => line.replace(/^\s*\*\s?/, '').trim())
      .filter(line => line && !line.startsWith('POST /') && !line.startsWith('GET /') && !line.startsWith('PUT /') && !line.startsWith('DELETE /'));
    if (commentLines.length > 0) {
      description = commentLines.join(' ');
    }
  }

  // 构建数据
  methods.forEach(method => {
    // 尝试提取请求体验证 schema
    let requestBody = "{}";
    if (method === 'POST' || method === 'PUT') {
      const schemaMatch = content.match(/z\.object\({([\s\S]*?)}\)/);
      if (schemaMatch) {
         const schemaBody = schemaMatch[1].split('\n').map(line => {
            const clean = line.trim().replace(/,$/, '');
            if (!clean) return '';
            const parts = clean.split(':');
            if (parts.length < 2) return '';
            const key = parts[0].trim();
            let typeDesc = "any";
            if (parts[1].includes('z.string()')) typeDesc = '"string"';
            if (parts[1].includes('z.number()')) typeDesc = '0';
            if (parts[1].includes('z.boolean()')) typeDesc = 'true';
            
            let comment = "";
            if (line.includes('//')) comment = " // " + line.split('//')[1].trim();
            
            return `  "${key}": ${typeDesc}${comment}`;
         }).filter(Boolean).join(',\n');
         if (schemaBody) requestBody = `{\n${schemaBody}\n}`;
      } else {
         requestBody = "// 未检测到Zod schema验证，具体格式请参考源码";
      }
    } else {
       requestBody = "// 该方法通常没有 Request Body";
    }

    apiData.push({
      id: `${method}-${apiPath}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(),
      title: `${method} ${apiPath} 接口`,
      method,
      path: apiPath,
      description,
      requestHeaders: "Authorization: Bearer <token>\nContent-Type: application/json",
      requestBody,
      responseSuccess: '{\n  "success": true,\n  "data": { ... }\n}',
      responseError: '{\n  "success": false,\n  "error": "错误信息"\n}'
    });
  });
});

fs.writeFileSync(outputFile, JSON.stringify(apiData, null, 2));
console.log(`Generated ${apiData.length} API docs`);
