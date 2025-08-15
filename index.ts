import fs from 'fs'
import path from 'path'

const extArg = process.argv[2]
if (!extArg) {
  console.error('Usage: ts-node find-unused-files.ts <extension>')
  process.exit(1)
}

const EXCLUDED_FOLDER_NAMES = ['.git', '.idea', 'node_modules']
const EXCLUDED_FILE_NAMES = ['TahlildadehMvc.csproj', 'package.json']
const EXCLUDED_FILE_TYPES = ['png', 'csproj']

const searchDir = process.cwd()

type folan = {dir: string, ext?: string}

const walkDir = ({dir, ext}: folan, callback: (fileFullPath: string) => boolean) => {
  for (const fileName of fs.readdirSync(dir)) {
    if (EXCLUDED_FOLDER_NAMES.includes(fileName)) continue

    const fileFullPath = path.join(dir, fileName)
    const stat = fs.statSync(fileFullPath)

    if (stat.isDirectory()) {
      walkDir({dir: fileFullPath, ext}, callback)
    } else {
      if (EXCLUDED_FILE_NAMES.includes(fileName)) continue
      if (ext && !fileName.endsWith("." + ext)) continue

      const shouldContinue = callback(fileFullPath)
      if (!shouldContinue) break
    }
  }
}

// Walk that stops recursion immediately when callback returns false
const walkDirStopEarly = ({dir, ext}: folan, callback: (fileFullPath: string) => boolean): boolean => {
  for (const fileName of fs.readdirSync(dir)) {
    if (EXCLUDED_FOLDER_NAMES.includes(fileName)) continue

    const fileFullPath = path.join(dir, fileName)
    const stat = fs.statSync(fileFullPath)

    if (stat.isDirectory()) {
      const shouldContinue = walkDirStopEarly({dir: fileFullPath, ext}, callback)
      if (!shouldContinue) return false
    } else {
      if (EXCLUDED_FILE_NAMES.includes(fileName)) continue
      if (ext && !fileName.endsWith("." + ext)) continue

      const shouldContinue = callback(fileFullPath)
      if (!shouldContinue) return false
    }
  }
  return true
}

let unusedFiles: string[] = []

walkDir({dir: searchDir, ext: extArg}, (fileFullPath: string) => {
  const lookingFor = path.basename(fileFullPath)
  console.log(`🔎 Searching for references of ${lookingFor}`)
  let foundReference = false

  walkDirStopEarly({dir: searchDir}, (innerFile) => {
    if (innerFile === fileFullPath) return true
    debugger
    let typeExcluded = EXCLUDED_FILE_TYPES.reduce<boolean>((p,c) => {
      return innerFile.endsWith("." + c) && p
    }, false)
    
    if (typeExcluded) return false
    const content = fs.readFileSync(innerFile, 'utf-8')
    if (new RegExp(`\\b${lookingFor}\\b`).test(content)) {
      console.log(`- found reference of "${lookingFor}" in "${path.basename(innerFile)}"`)
      foundReference = true
      return false
    }
    return true
  })

  if (!foundReference) {
    console.log(`🚫 Unused: ${lookingFor}`)
    unusedFiles.push(lookingFor)
  }

  return true
})

if (unusedFiles.length) {
  console.log('\n📦 List of unused files:')
  unusedFiles.forEach(u => console.log(u))
} else {
  console.log(`✅ No unused ${extArg} files found.`)
}