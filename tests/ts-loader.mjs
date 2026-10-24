import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

export async function load(url, context, nextLoad) {
  if (!url.endsWith('.ts')) return nextLoad(url, context)
  const source = readFileSync(fileURLToPath(url), 'utf8')
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2023,
      verbatimModuleSyntax: false,
    },
    fileName: fileURLToPath(url),
  })
  return {
    format: 'module',
    source: result.outputText,
    shortCircuit: true,
  }
}
