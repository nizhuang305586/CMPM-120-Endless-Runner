class Play extends Phaser.Scene {
    constructor() {
        super('Play')
    }

    create() {
        //create keys

        this.keys = this.input.keyboard.addKeys({
            QKey: Phaser.Input.Keyboard.KeyCodes.Q,
            EKey: Phaser.Input.Keyboard.KeyCodes.E,
            SKey: Phaser.Input.Keyboard.KeyCodes.S,
            FKey: Phaser.Input.Keyboard.KeyCodes.F,
            SpaceKey: Phaser.Input.Keyboard.KeyCodes.SPACE
        })
    }

    update() {
        this.runnerFSM.step()
    }

}