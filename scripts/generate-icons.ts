import * as fs from 'fs';
import * as path from 'path';
import svg2png from 'svg2png';
import sharp from 'sharp';
import { execSync } from 'child_process';

const SOURCE_SVG_PATH: string = path.join(__dirname, '../build/icon.svg');
const BUILD_DIR: string = path.join(__dirname, '../build');

// PNGサイズ配列を定義
const PNG_SIZES: number[] = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

async function generateIcons(): Promise<void> {
  try {
    console.log('アイコンの生成を開始します...');
    
    // 元のSVGファイルが存在するか確認
    if (!fs.existsSync(SOURCE_SVG_PATH)) {
      throw new Error('SVGファイル（build/icon.svg）が見つかりません');
    }

    // SVG取得
    const svgBuffer: Buffer = fs.readFileSync(SOURCE_SVG_PATH);

    // Linux用のPNG生成（512x512）
    console.log('Linux用のPNGを生成しています...');
    const pngBuffer: Buffer = await svg2png(svgBuffer, { width: 512, height: 512 });
    fs.writeFileSync(path.join(BUILD_DIR, 'icon.png'), pngBuffer);

    // Windows用の.ico生成のためにまず複数サイズのPNGを作成
    console.log('Windows用の.icoを生成するためのPNGを準備しています...');
    const tempIconsDir: string = path.join(BUILD_DIR, 'temp_icons');
    
    if (!fs.existsSync(tempIconsDir)) {
      fs.mkdirSync(tempIconsDir, { recursive: true });
    }
    
    // 各サイズのPNGを生成
    for (const size of PNG_SIZES) {
      console.log(`${size}x${size} PNGを生成しています...`);
      const resizedPng: Buffer = await svg2png(svgBuffer, { width: size, height: size });
      fs.writeFileSync(path.join(tempIconsDir, `icon-${size}.png`), resizedPng);
    }

    console.log('アイコン生成完了！');
    console.log('-------------------');
    console.log('注意: Windows用の.icoとMac用の.icnsファイルは、別途ツールを使用して生成する必要があります。');
    console.log('Windows用: build/temp_icons内のPNGからicoファイルを生成し、build/icon.icoとして保存してください。');
    console.log('Mac用: build/icon.pngからicnsファイルを生成し、build/icon.icnsとして保存してください。');
    console.log('-------------------');
    console.log('オンラインのコンバーターを使用することもできます:');
    console.log('- https://convertio.co/png-ico/ (PNG to ICO)');
    console.log('- https://cloudconvert.com/png-to-icns (PNG to ICNS)');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
generateIcons(); 