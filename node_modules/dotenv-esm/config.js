import dotenv from './lib/main.js'
import envOptions from './lib/env-options.js'
import cliOptions from './lib/cli-options.js'

dotenv.config(Object.assign(
  envOptions,
  cliOptions
))
