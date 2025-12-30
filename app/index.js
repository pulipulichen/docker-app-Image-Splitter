const ShellSpawn = require('./lib/ShellSpawn')
const ShellExec = require('./lib/ShellExec')
const GetFiles = require('./lib/GetFiles')

const path = require('path')
const fs = require('fs')

// convert a.tif -thumbnail 64x64^ -gravity center -extent 64x64 b.ico

let main = async function () {
  let files = GetFiles()
  for (let i = 0; i < files.length; i++) {
    let file = files[i]
    
    let filename = path.basename(file)
    let dirname = path.dirname(file)
    let filenameNoExt = path.parse(filename).name
    let ext = path.extname(filename)

    await ShellExec(`cp "${file}" /tmp/input.${ext}`)
    file = `/tmp/input.${ext}`

    let isJPG = false
    let isAVIF = false

    console.log({ext, file})
    if (ext === '.pdf') {
      await ShellExec(`pdftoppm "${file}" "${filenameNoExt}" -png`)
      file = `${filenameNoExt}-1.png`
      ext = '.png'
    }

    if (ext === '.jpg' || ext === '.jpeg' || ext === '.avif') { 
      isJPG = true
    }

    if (ext === '.avif') { 
      isAVIF = true
    }

    if (ext === '.jpg' || ext === '.jpeg' || ext === '.webp' || ext === '.avif') { 
      ext = '.png'
    }

    // await ShellExec(`convert "${file}" -trim +repage "${path.resolve(dirname, filenameNoExt + '-cropped.' +ext)}"`)
    // await ShellExec(`convert "${file}" -transparent white -trim +repage "${path.resolve(dirname, filenameNoExt + '-cropped.' +ext)}"`)

    // let channels = await ShellExec(`identify -format '%[channels]' "${file}"`)
    let channels = '0'
    if (isJPG === false) {
      channels = await ShellExec(`convert "${file}" -channel a -separate -format "%[fx:mean]" info:`)
    }
    else {
      channels = '1'
    }

    // ========================
    // 用multicrop來切割吧
    await ShellExec(`mkdir -p /tmp/multicrop`)
    await ShellExec(`rm -rf /tmp/multicrop/*`)
    await ShellExec(`/app/multicrop "${file}" /tmp/multicrop/output.png`)


    // ==========================

    // 幫我列出 /tmp/multicrop 裡面所有檔案，然後echo出來
    let multicropFiles = fs.readdirSync('/tmp/multicrop')
    multicropFiles.forEach(async (multicropFile, i) => {
      // console.log(path.join('/tmp/multicrop', multicropFile))

      let input_multicrop_file = path.join('/tmp/multicrop', multicropFile)

      // fs.writeFileSync(file + '-channels.txt', channels, 'utf8')
      // if (channels.indexOf('a') > -1) {
      dirname = '/output/'
      if (channels !== '1') {
        // await ShellExec(`convert "${file}" -alpha set -bordercolor transparent -border 1 -fill none -fuzz 3% -draw "color 0,0 floodfill" -shave 1x1 -trim +repage "${path.resolve(dirname, filenameNoExt + '-cropped' +ext)}"`)
        // console.log(`convert "${file}" -trim +repage "${path.resolve(dirname, filenameNoExt + '-cropped' +ext)}"`)
        await ShellExec(`convert "${input_multicrop_file}" -trim +repage "${path.resolve(dirname, filenameNoExt + '-' + i + '-cropped' +ext)}"`)
      }
      else {
        await ShellExec(`convert "${input_multicrop_file}" -alpha set -bordercolor white -border 1 -fill none -fuzz 2% -draw "color 0,0 floodfill" -shave 1x1 -fuzz 5% -trim +repage "${path.resolve(dirname, filenameNoExt + '-' + i + '-cropped' +ext)}"`)
      }
      // convert -gravity center "c.png" -flatten -fuzz 1% -trim +repage -resize 64x64 -extent 64x64 "b.ico"

      // console.log({isAVIF})
      if (isAVIF) {
        let tmp2 = path.resolve(dirname, filenameNoExt + '-' + i + '-cropped' +ext)
        let tmp3 = path.resolve(dirname, filenameNoExt + '-' + i + '-cropped3' +ext)
        await ShellExec(`convert "${tmp2}" -alpha set -bordercolor white -border 1 -fill none -fuzz 2% -draw "color 0,0 floodfill" -shave 1x1 -fuzz 5% -trim +repage "${tmp3}"`)

        fs.unlinkSync(tmp2)
        fs.renameSync(tmp3, tmp2)
      }
    })

    
  }
}

main()
