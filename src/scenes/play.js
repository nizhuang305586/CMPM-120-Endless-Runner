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
        console.log('tilesetName:', tilesetName)
        console.log('tileset:', tileset)
        console.log('devTiles texture exists?', this.textures.exists('devTiles'))

        const worldLayer = map.createLayer('Colliders', tileset, 0, 0)
        console.log('worldLayer size:', worldLayer.layer.width, worldLayer.layer.height)
        console.log('worldLayer has tile at 0,0 index:', worldLayer.getTileAt(0, 0)?.index)
        console.log('worldLayer non-empty tile count:', worldLayer.getTilesWithin().filter(t => t.index !== -1).length)
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
        const hazardLayer = map.createLayer('Hazards', tileset, 0, 0)
        const dummySpawn = map.findObject('SpawnPoint', obj => obj.name === 'dummySpawn')

        this.runner = this.add.rectangle(dummySpawn.x, dummySpawn.y, 32, 48, 0xffffff)
        this.physics.add.existing(this.runner)


        this.physics.add.collider(this.runner, worldLayer)
        this.physics.add.overlap(this.runner, hazardLayer, () => {
            console.log('Hit Hazard')
        }) 

        this.runner.body.setCollideWorldBounds(true)
        this.runner.body.setGravityY(800)
        this.runner.body.setVelocityX(160)

        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
        this.cameras.main.startFollow(this.runner, true, 1, 1)



        worldLayer.setCollisionByProperty({ collides: true })
        hazardLayer.setCollisionByProperty({ hazard: true })
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.SpaceKey) && this.runner.body.blocked.down) {
            this.runner.body.setVelocityY(-350)
        }

        if (this.keys.SKey.isDown) {
            this.runner.body.setSize(32, 16)
            this.runner.body.setOffset(0, 32)
        } else {
            this.runner.body.setSize(32, 48)
            this.runner.body.setOffset(0, 0)
        }
    }

}