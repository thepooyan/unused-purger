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
const EXCLUDED_FILE_NAMES = ['TahlildadehMvc.csproj', 'package.json', 'BundleConfigold2.cs', 'bundleConfigold.cs', 'BundleConfigold.cs']
const target_file_extentions = ['scss', 'css', 'js', 'cs', 'cshtml']

try {
  process.chdir(address)
} catch(_) {
  console.error(`Cannot find the folder specified: "${address}"`)
  process.exit(1)
}

const fileName = `Ununsed_${extArg}_files.txt`
const saveToFile = (str: string) => {
  fs.appendFile("./unused logs/"+fileName, [str, "\n"].join(), (err) => {
    if (err) {
      console.error('Error writing file:', err);
    } 
  });
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
let filesChecked = 1;
for (const lockedFile of lock_files) {
  const lockedFileName = path.basename(lockedFile)
  let foundReference = false
  console.log(`🔎 (${filesChecked++}/${lock_files.length}) Searching for references of "${lockedFileName}"`)

for (const targetFile of target_files) {

    const targetFileName = path.basename(targetFile)
    if (targetFileName === lockedFileName) continue
    if (EXCLUDED_FILE_NAMES.includes(targetFileName)) continue

    const content = fs.readFileSync(targetFile, 'utf-8')
    const result = new RegExp(`\\b${lockedFileName}\\b`).test(content)

    if (result) {
      const checkAgain = new RegExp(`(".*?\\b${lockedFileName.replaceAll(".","\\.")}")|('.*?\\b${lockedFileName.replaceAll(".","\\.")}')`).test(content)
      if (checkAgain) {
        console.log(`- found reference of "${lockedFileName}" in "${targetFileName}"`)
        foundReference = true
        break
      }
    }
  }
  if (!foundReference) {
    console.log(`🚫 Unused: ${lockedFile}`)
    unusedFiles.push(lockedFileName)
    saveToFile(lockedFileName)
  }
}

if (unusedFiles.length === 0) {
  console.log(`No unused ${extArg} files found!`)
  process.exit()
}

console.log(`🚫 Unused files:`)
unusedFiles.forEach(u => console.log(u))
