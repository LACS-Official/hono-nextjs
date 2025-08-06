#!/usr/bin/env node

/**
 * Android USB驱动程序下载脚本
 * 自动下载并配置Universal ADB Driver
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// 配置
const DRIVER_CONFIG = {
  // Universal ADB Driver GitHub仓库
  repository: 'alongL/NB_Universal_ADB_Driver',
  branch: 'master',
  // 本地驱动目录
  driverDir: path.join(__dirname, '../src-tauri/resources/drivers'),
  // 需要的文件列表
  requiredFiles: [
    'android_winusb.inf',
    'WinUSBCoInstaller2.dll',
    'WinUSBCoInstaller.dll',
    'dpinst.exe'
  ]
};

/**
 * 创建目录（如果不存在）
 */
function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ 创建目录: ${dirPath}`);
  }
}

/**
 * 下载文件
 */
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    console.log(`📥 下载: ${url}`);
    
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // 处理重定向
        return downloadFile(response.headers.location, filePath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`下载失败: HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ 下载完成: ${path.basename(filePath)}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {}); // 删除不完整的文件
        reject(err);
      });
    }).on('error', reject);
  });
}

/**
 * 从GitHub下载驱动文件
 */
async function downloadDriverFiles() {
  console.log('🚀 开始下载Android USB驱动文件...');
  
  // 确保目录存在
  ensureDirectory(DRIVER_CONFIG.driverDir);
  
  const baseUrl = `https://raw.githubusercontent.com/${DRIVER_CONFIG.repository}/${DRIVER_CONFIG.branch}`;
  
  // 下载每个必需的文件
  for (const fileName of DRIVER_CONFIG.requiredFiles) {
    const fileUrl = `${baseUrl}/${fileName}`;
    const filePath = path.join(DRIVER_CONFIG.driverDir, fileName);
    
    try {
      await downloadFile(fileUrl, filePath);
    } catch (error) {
      console.error(`❌ 下载失败 ${fileName}:`, error.message);
      
      // 如果是dpinst.exe下载失败，尝试备用源
      if (fileName === 'dpinst.exe') {
        console.log('🔄 尝试备用下载源...');
        try {
          // 可以添加备用下载源
          console.log('⚠️  dpinst.exe下载失败，将使用系统pnputil作为备用方案');
        } catch (backupError) {
          console.error('❌ 备用下载也失败:', backupError.message);
        }
      }
    }
  }
}

/**
 * 创建自定义INF文件
 */
function createCustomInfFile() {
  const infContent = `; Android USB Driver
; Universal ADB Driver for HOUT Tool

[Version]
Signature="$Windows NT$"
Class=AndroidUsbDeviceClass
ClassGuid={3F966BD9-FA04-4ec5-991C-D326973B5128}
Provider=%ProviderName%
DriverVer=01/01/2024,1.0.0.0
CatalogFile=android_winusb.cat

[ClassInstall32]
Addreg=AndroidWinUsbClassReg

[AndroidWinUsbClassReg]
HKR,,,0,%ClassName%
HKR,,Icon,,-1

[Manufacturer]
%ProviderName%=Google,NTx86,NTamd64

[Google.NTx86]
%CompositeAdbInterface%     = USB_Install, USB\\VID_18D1&PID_4EE1&MI_01
%CompositeAdbInterface%     = USB_Install, USB\\VID_18D1&PID_4EE2&MI_01
%CompositeAdbInterface%     = USB_Install, USB\\VID_18D1&PID_4EE0&MI_01

[Google.NTamd64]
%CompositeAdbInterface%     = USB_Install, USB\\VID_18D1&PID_4EE1&MI_01
%CompositeAdbInterface%     = USB_Install, USB\\VID_18D1&PID_4EE2&MI_01
%CompositeAdbInterface%     = USB_Install, USB\\VID_18D1&PID_4EE0&MI_01

[USB_Install]
Include=winusb.inf
Needs=WINUSB.NT

[USB_Install.Services]
Include=winusb.inf
AddService=WinUSB,0x00000002,WinUSB_ServiceInstall

[WinUSB_ServiceInstall]
DisplayName     = %WinUSB_SvcDesc%
ServiceType     = 1
StartType       = 3
ErrorControl    = 1
ServiceBinary   = %12%\\WinUSB.sys

[USB_Install.Wdf]
KmdfService=WINUSB, WinUsb_Install

[WinUsb_Install]
KmdfLibraryVersion=1.11

[USB_Install.HW]
AddReg=Dev_AddReg

[Dev_AddReg]
HKR,,DeviceInterfaceGUIDs,0x10000,"{F72FE0D4-CBCB-407d-8814-9ED673D0DD6B}"

[USB_Install.CoInstallers]
AddReg=CoInstallers_AddReg
CopyFiles=CoInstallers_CopyFiles

[CoInstallers_AddReg]
HKR,,CoInstallers32,0x00010000,"WinUSBCoInstaller2.dll"

[CoInstallers_CopyFiles]
WinUSBCoInstaller2.dll

[DestinationDirs]
CoInstallers_CopyFiles=11

[SourceDisksNames]
1 = %DiskName%,,,\\i386
2 = %DiskName%,,,\\amd64

[SourceDisksFiles.x86]
WinUSBCoInstaller2.dll=1

[SourceDisksFiles.amd64]
WinUSBCoInstaller2.dll=2

[Strings]
ProviderName="HOUT Tool"
ClassName="Android Device"
WinUSB_SvcDesc="Android USB Driver"
DiskName="Android USB Driver Installation Disk"
CompositeAdbInterface="Android Composite ADB Interface"
`;

  const infPath = path.join(DRIVER_CONFIG.driverDir, 'android_winusb.inf');
  fs.writeFileSync(infPath, infContent, 'utf8');
  console.log('✅ 创建自定义INF文件');
}

/**
 * 验证下载的文件
 */
function validateDriverFiles() {
  console.log('🔍 验证驱动文件...');
  
  let allFilesValid = true;
  
  for (const fileName of DRIVER_CONFIG.requiredFiles) {
    const filePath = path.join(DRIVER_CONFIG.driverDir, fileName);
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > 0) {
        console.log(`✅ ${fileName} (${(stats.size / 1024).toFixed(1)} KB)`);
      } else {
        console.log(`❌ ${fileName} (文件为空)`);
        allFilesValid = false;
      }
    } else {
      console.log(`❌ ${fileName} (文件不存在)`);
      allFilesValid = false;
    }
  }
  
  return allFilesValid;
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🔧 HOUT工具 - Android USB驱动下载器');
    console.log('=====================================');
    
    // 下载驱动文件
    await downloadDriverFiles();
    
    // 创建自定义INF文件（如果原版不适用）
    if (!fs.existsSync(path.join(DRIVER_CONFIG.driverDir, 'android_winusb.inf'))) {
      createCustomInfFile();
    }
    
    // 验证文件
    const isValid = validateDriverFiles();
    
    if (isValid) {
      console.log('\n🎉 驱动文件下载完成！');
      console.log('📁 文件位置:', DRIVER_CONFIG.driverDir);
      console.log('\n📋 下一步:');
      console.log('1. 运行 npm run tauri:build 构建应用');
      console.log('2. 在应用中使用"安装设备驱动"功能');
    } else {
      console.log('\n⚠️  部分文件下载失败，请检查网络连接后重试');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 下载过程中发生错误:', error.message);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  downloadDriverFiles,
  validateDriverFiles,
  DRIVER_CONFIG
};
