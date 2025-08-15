import fs from 'fs'
import path from 'path'
import fg from 'fast-glob'

const address = process.argv[2]
const extArg = process.argv[3]

if (!extArg || !address) {
  console.error('Usage: ts-node find-unused-files.Ts <address> <extension>')
  process.exit(1)
}

const EXCLUDED_FOLDER_NAMES = ['.git', '.idea', 'node_modules', 'bin']
const EXCLUDED_FILE_NAMES = ['TahlildadehMvc.csproj', 'package.json']
const target_file_extentions = ['scss', 'css', 'js', 'cs', 'cshtml']

try {
  process.chdir(address)
} catch(_) {
  console.error(`Cannot find the folder specified: "${address}"`)
  process.exit(1)
}

console.log(`Searching for ${extArg} files...`)

const lock_files = await fg( `**/*.${extArg}`, {
  cwd: process.cwd(),
  ignore: EXCLUDED_FOLDER_NAMES,
  onlyFiles: true,
  absolute: true
})

console.log(`Fount ${lock_files.length} ${extArg} files`)

const target_files = await fg( `**/*.{${target_file_extentions.join(',')}}`, {
  cwd: process.cwd(),
  ignore: EXCLUDED_FOLDER_NAMES,
  onlyFiles: true,
  absolute: true
})


let unusedFiles:string[] = []
for (const lockedFile of lock_files) {
  const lockedFileName = path.basename(lockedFile)
  let foundReference = false
  console.log(`🔎 Searching for references of "${lockedFileName}"`)

for (const targetFile of target_files) {

    const targetFileName = path.basename(targetFile)
    const content = fs.readFileSync(targetFile, 'utf-8')
    let result = new RegExp(`\\b${lockedFileName}\\b`).test(content)

    if (result) {
      console.log(`- found reference of "${lockedFileName}" in "${targetFileName}"`)
      foundReference = true
      break
    }
  }
  if (!foundReference) {
    console.log(`🚫 Unused: ${lockedFile}`)
    unusedFiles.push(lockedFileName)
  }
}

unusedFiles.forEach(u => {
  console.log(`🚫 Unused: ${u}`)
})