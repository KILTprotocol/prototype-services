import * as dotenv from 'dotenv'
import * as fs from 'fs'

export class ConfigService {
  private readonly envConfig: { [key: string]: string }

  constructor(filePath: string) {
    this.envConfig = fs.existsSync(filePath)
      ? dotenv.parse(fs.readFileSync(filePath))
      : {}
  }

  public get(key: string): string {
    return process.env[key] || this.envConfig[key]
  }
}
