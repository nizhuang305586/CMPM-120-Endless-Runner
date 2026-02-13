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
        

        const map = this.make.tilemap({ key: 'devMap' })
        const tilesetName = map.tilesets[0].name //avoid guessing the tileset name :P
        const tileset = map.addTilesetImage(tilesetName, 'devTiles')
        const worldLayer = map.createLayer('Colliders', tileset, 0, 0)
        const hazardLayer = map.createLayer('Hazards', tileset, 0, 0)
        const dummySpawn = map.findObject('SpawnPoint', obj => obj.name === 'dummySpawn')

        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
        worldLayer.setCollisionByProperty({ collides: true })
        hazardLayer.setCollisionByProperty({ hazard: true })

        this.runner = new Runner(this, dummySpawn.x, dummySpawn.y, 'testNaoya', 0)

        this.runner.body.setCollideWorldBounds(true)
        this.runner.body.setGravityY(800)

        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
        this.cameras.main.startFollow(this.runner, true, 0.15, 0.15)
        this.cameras.main.setDeadzone(this.scale.width * 0.2, this.scale.height)
        this.cameras.main.setFollowOffset(-this.scale.width * 0.45, 0)

        this.physics.add.collider(this.runner, worldLayer)
        this.physics.add.overlap(this.runner, hazardLayer, () => {
            console.log('Hit Hazard')
        })
    }

    update() {
        this.runnerFSM.step()
    }

}