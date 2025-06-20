import { build, env } from 'bun'

await build({
    entrypoints: ['./src/index.ts'],
    outdir: './dist',
    target: 'node',
    format: 'esm',
    sourcemap: 'external',
    minify: env.NODE_ENV === 'production',
    external: [],
})
