import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { validateCropAssets } from './grade4-unit1-lessons56.shared.mjs';

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'grade4-lessons56-crops-'));
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL72AAAAABJRU5ErkJggg==', 'base64');
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const setup = name => {
  const rootDirectory = path.join(tempRoot, name);
  const cropsDirectory = path.join(rootDirectory, 'assets', 'fixture', 'crops');
  fs.mkdirSync(path.dirname(cropsDirectory), { recursive: true });
  return { rootDirectory, cropsDirectory };
};
const zeroManifest = { cropCount: 0, crops: [] };
const validate = ({ manifest = zeroManifest, ...paths }) => validateCropAssets({ manifest, ...paths });

try {
  {
    const paths = setup('zero-missing');
    assert.equal(fs.existsSync(paths.cropsDirectory), false);
    assert.doesNotThrow(() => validate({ ...paths }));
    console.log('PASS zero declared crops with missing directory');
  }
  {
    const paths = setup('zero-empty');
    fs.mkdirSync(paths.cropsDirectory);
    assert.doesNotThrow(() => validate({ ...paths }));
    console.log('PASS zero declared crops with empty directory');
  }
  {
    const paths = setup('zero-unexpected');
    fs.mkdirSync(paths.cropsDirectory);
    fs.writeFileSync(path.join(paths.cropsDirectory, 'unexpected.png'), png);
    assert.throws(() => validate({ ...paths }), /unexpected files for zero declared crops/);
    console.log('PASS zero declared crops rejects unexpected files');
  }
  {
    const paths = setup('declared-missing');
    const manifest = {
      cropCount: 1,
      crops: [{ file: 'assets/fixture/crops/crop.png', sha256: sha256(png), width: 1, height: 1 }]
    };
    assert.equal(fs.existsSync(paths.cropsDirectory), false);
    assert.throws(() => validate({ ...paths, manifest }), /declared crops require an existing directory/);
    console.log('PASS declared crops reject missing directory');
  }
  {
    const paths = setup('declared-valid');
    fs.mkdirSync(paths.cropsDirectory);
    fs.writeFileSync(path.join(paths.cropsDirectory, 'crop.png'), png);
    const manifest = {
      cropCount: 1,
      crops: [{
        file: 'assets/fixture/crops/crop.png',
        sha256: sha256(png),
        width: 1,
        height: 1,
        sourceFile: 'assets/fixture/source/page.png',
        sourceImageNumber: 1,
        sourceBounds: { x: 0, y: 0, width: 1, height: 1 }
      }]
    };
    const sourceImages = [{ uploadIndex: 1, file: 'assets/fixture/source/page.png', width: 1, height: 1 }];
    assert.doesNotThrow(() => validate({
      ...paths,
      manifest,
      sourceImages,
      lessonHtml: '<img src="assets/fixture/crops/crop.png">'
    }));
    console.log('PASS declared crop verifies inventory, SHA-256, PNG dimensions, source bounds, and lesson usage');
  }
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
