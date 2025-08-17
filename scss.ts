import fs from 'fs'
import path from 'path'
import fg from 'fast-glob'

const address = process.argv[2]
const extArg = "scss"

if (!extArg || !address) {
  console.error('Usage: ts-node find-unused-files.Ts <address> <extension>')
  process.exit(1)
}

const EXCLUDED_FOLDER_NAMES = ['.git', '.idea', 'node_modules', 'bin']
const EXCLUDED_FILE_NAMES = ['TahlildadehMvc.csproj', 'package.json', 'BundleConfigold2.cs', 'bundleConfigold.cs', 'BundleConfigold.cs']
const target_file_extentions = ['scss', 'cs', 'cshtml']

try {
  process.chdir(address)
} catch(_) {
  console.error(`Cannot find the folder specified: "${address}"`)
  process.exit(1)
}

const saveToFile = (str: string, filename: string) => {
  fs.appendFile("./unused logs/"+ filename, [str, "\n"].join(), (err) => {
    if (err) {
      console.error('Error writing file:', err);
    } 
  });
}

const unusedLogFileName = () => `Ununsed_${extArg}_files.txt`
const logFileName = () => `${extArg}_logs.txt`

// const loadUnused = () => {
//   const unusedLogs = fs.readFileSync(`./unused logs/${unusedLogFileName()}`, "utf-8")
//   const logs = fs.readFileSync(`./unused logs/${logFileName()}`, "utf-8")

//   const isInLogs = (fileName: string) => unusedLogs.includes(fileName) | logs.includes

//   return {isInLogs}
// }

// const {isInLogs} = loadUnused()

const saveToUnused = (str: string) => saveToFile(str, unusedLogFileName())
const saveToLogs = (str: string) => saveToFile(str, logFileName())

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
  let lockedFileName = path.basename(lockedFile)
  if (extArg === "scss") {
    lockedFileName = path.basename(lockedFileName, ".scss")
    if (lockedFileName.startsWith("_"))
        lockedFileName = lockedFileName.substring(1)
  }
  
  let foundReference = false
  console.log(`🔎 (${filesChecked++}/${lock_files.length}) Searching for references of "${lockedFileName}"`)
  // if (isInLogs(lockedFileName)) {
  //   console.log(`already checked for: ${lockedFileName}`)
  //   continue
  // }

for (const targetFile of target_files) {

    const targetFileName = path.basename(targetFile)
    if (targetFileName === lockedFileName) continue
    if (EXCLUDED_FILE_NAMES.includes(targetFileName)) continue

    const content = fs.readFileSync(targetFile, 'utf-8')
    const result = new RegExp(`\\b${lockedFileName}\\b`).test(content)

    if (result) {
      const checkAgain = new RegExp(`(".*?\\b${lockedFileName.replaceAll(".","\\.")}")|('.*?\\b${lockedFileName.replaceAll(".","\\.")}')`).test(content)
      if (true) {
        console.log(`- found reference of "${lockedFileName}" in "${targetFileName}"`)
        saveToLogs(`- found reference of "${lockedFileName}" in "${targetFileName}"`)
        foundReference = true
        break
      }
    }
  }
  if (!foundReference) {
    console.log(`🚫 Unused: ${lockedFile}`)
    unusedFiles.push(lockedFileName)
    saveToUnused(lockedFile)
  }
}

if (unusedFiles.length === 0) {
  console.log(`No unused ${extArg} files found!`)
  process.exit()
}

console.log(`🚫 Unused files:`)
unusedFiles.forEach(u => console.log(u))
