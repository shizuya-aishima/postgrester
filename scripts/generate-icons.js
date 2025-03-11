const fs = require('fs');
const path = require('path');
const svg2png = require('svg2png');
const sharp = require('sharp');
const pngToIco = require('png-to-ico');
const { execSync } = require('child_process');

const SOURCE_SVG_PATH = path.join(__dirname, '../build/icon.svg');
const BUILD_DIR = path.join(__dirname, '../build');

// PNGサイズ配列を定義
const PNG_SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
// Windows ICO用のサイズ
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];

async function generateIcons() {
  try {
    console.log('アイコンの生成を開始します...');
    
    // 元のSVGファイルが存在するか確認
    if (!fs.existsSync(SOURCE_SVG_PATH)) {
      throw new Error('SVGファイル（build/icon.svg）が見つかりません');
    }

    // SVG取得
    const svgBuffer = fs.readFileSync(SOURCE_SVG_PATH);

    // Linux用のPNG生成（512x512）
    console.log('Linux用のPNGを生成しています...');
    const pngBuffer = await svg2png(svgBuffer, { width: 512, height: 512 });
    fs.writeFileSync(path.join(BUILD_DIR, 'icon.png'), pngBuffer);

    // Windows用の.ico生成のためにまず複数サイズのPNGを作成
    console.log('Windows用の.icoを生成するためのPNGを準備しています...');
    const tempIconsDir = path.join(BUILD_DIR, 'temp_icons');
    
    if (!fs.existsSync(tempIconsDir)) {
      fs.mkdirSync(tempIconsDir, { recursive: true });
    }
    
    // 各サイズのPNGを生成
    for (const size of PNG_SIZES) {
      console.log(`${size}x${size} PNGを生成しています...`);
      const resizedPng = await svg2png(svgBuffer, { width: size, height: size });
      fs.writeFileSync(path.join(tempIconsDir, `icon-${size}.png`), resizedPng);
    }

    // Windows用のicoファイルを生成
    console.log('Windows用の.icoファイルを生成しています...');
    try {
      const pngPaths = ICO_SIZES.map(size => path.join(tempIconsDir, `icon-${size}.png`));
      const icoBuffer = await pngToIco(pngPaths);
      fs.writeFileSync(path.join(BUILD_DIR, 'icon.ico'), icoBuffer);
      console.log('Windows用の.icoファイルを生成しました: build/icon.ico');
    } catch (icoError) {
      console.error('Windows用の.icoファイル生成に失敗しました:', icoError);
    }

    console.log('アイコン生成完了！');
    console.log('-------------------');
    console.log('注意: Mac用の.icnsファイルは、別途ツールを使用して生成する必要があります。');
    console.log('Mac用: build/icon.pngからicnsファイルを生成し、build/icon.icnsとして保存してください。');
    console.log('-------------------');
    console.log('オンラインのコンバーターを使用することもできます:');
    console.log('- https://cloudconvert.com/png-to-icns (PNG to ICNS)');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
generateIcons(); 