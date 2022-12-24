import * as util from '../src/components/util'

describe('Translation', () => {
  it('executes utilities correctly', async () => {
    expect(async () => {
      await util.sleep(1)
      await util.recoveryFileExist()
    }).not.toThrow()

    // this assumes connected on error
    expect(await util.alertIfConnected()).toBe(true)
  })
})
