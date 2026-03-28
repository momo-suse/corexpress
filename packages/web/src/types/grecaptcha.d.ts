interface GrecaptchaInstance {
  ready(callback: () => void): void
  execute(siteKey: string, options: { action: string }): Promise<string>
}

interface Window {
  grecaptcha: GrecaptchaInstance
}
