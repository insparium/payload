import type { Options } from '@swc-node/core'
import type * as ts from 'typescript'

import { transform } from '@swc-node/core'
import { SourcemapMap } from '@swc-node/sourcemap-support'

import { tsCompilerOptionsToSwcConfig } from './read-default-tsconfig.js'

const injectInlineSourceMap = ({
  code,
  filename,
  map,
}: {
  code: string
  filename: string
  map: string | undefined
}): string => {
  if (map) {
    SourcemapMap.set(filename, map)
    const base64Map = Buffer.from(map, 'utf8').toString('base64')
    const sourceMapContent = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${base64Map}`
    return `${code}\n${sourceMapContent}`
  }
  return code
}

export async function compile(
  sourcecode: string,
  filename: string,
  options: ts.CompilerOptions & { fallbackToTs?: (filename: string) => boolean },
): Promise<string> {
  if (filename.endsWith('.d.ts')) {
    return ''
  }

  const swcRegisterConfig = tsCompilerOptionsToSwcConfig(options, filename)
  const modifiedConfig: Options = {
    ...swcRegisterConfig,
    swc: {
      ...{ ...(swcRegisterConfig?.swc ?? {}) },
      jsc: {
        ...{ ...(swcRegisterConfig?.swc?.jsc ?? {}) },
        experimental: {
          ...{ ...(swcRegisterConfig?.swc?.jsc?.experimental ?? {}) },
          plugins: [
            ...(swcRegisterConfig?.swc?.jsc?.experimental?.plugins ?? []),
            [
              'swc-plugin-strip-components',
              {
                identifier: 'Component',
                lobotomize_use_client_files: true,
              },
            ],
          ],
        },
      },
    },
  }

  return transform(sourcecode, filename, modifiedConfig).then(({ code, map }) => {
    return injectInlineSourceMap({ code, filename, map })
  })
}