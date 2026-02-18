class Play extends Phaser.Scene {
    constructor() {
        super('Play')
    }

    create() {

        this.bgMusic = this.sound.add('bgMuix', { loop: true })
        this.bgMusic.play()
        this.bgMusic.setVolume(0.1)

        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('naoya', {
                start: 0,
                end: 7
            }),
            frameRate: 12,
            repeat: -1
        })

        //create keys
        this.keys = this.input.keyboard.addKeys({
            AKey: Phaser.Input.Keyboard.KeyCodes.A,
            DKey: Phaser.Input.Keyboard.KeyCodes.D,
            FKey: Phaser.Input.Keyboard.KeyCodes.F,
            SpaceKey: Phaser.Input.Keyboard.KeyCodes.SPACE,
            DebugKey: Phaser.Input.Keyboard.KeyCodes.G
        })
        this.TILE = 16
        this.CHUNK_W_TILES = 48
        this.CHUNK_H_TILES = 32
        this.CHUNK_W_PX = this.TILE * this.CHUNK_W_TILES
        this.CHUNK_H_PX = this.TILE * this.CHUNK_H_TILES
        this.PRELOAD_BUFFER = 600

        this.oldKey = null
        this.activeChunks = []
        this.safeZones = []
        this.solidLayers = []
        this.worldEndX = 0

        this.chunkKeys = ['chunk2', 'chunk3']

        const { runnerSP, platformsLayer, hazardsLayer } = this.spawnChunk('chunk1', 0)
        this.runner = new Runner(this, runnerSP.x, runnerSP.y, 'naoya', 0)

        this.physics.add.collider(this.runner, platformsLayer)
        this.runner.setDepth(10)
        this.runner.body.setGravityY(1000)
        this.runner.body.setCollideWorldBounds(true)

        this.cameras.main.startFollow(this.runner, true, 1, 1)
        this.cameras.main.setDeadzone(0, 0)
        this.cameras.main.setFollowOffset(-this.scale.width * 0.25, 0)
        this.cameras.main.setZoom(1.2)

        const worldH = Math.max(this.CHUNK_H_PX, this.scale.height)
        this.physics.world.setBounds(0, 0, this.worldEndX, worldH)
        this.cameras.main.setBounds(0, 0, this.worldEndX, worldH)

        this.freezeFrame = this.add.image(this.runner.x, this.runner.y, 'FreezeFrame')
        this.freezeFrame.setDepth(this.runner.depth - 1)
        this.freezeFrame.setVisible(false)

        if (hazardsLayer) {
            this.physics.add.overlap(this.runner, hazardsLayer, () => console.log('Hit Hazard'))
        }
    }

    spawnChunk(key, chunkX) {
        const map = this.make.tilemap({ key })
        const tilesetName = map.tilesets[0].name
        const tileset1 = map.addTilesetImage('Grassland_Terrain_Tileset', 'TerrainTiles')
        const tileset2 = map.addTilesetImage('dev_tiles', 'devTiles')
        const yOffset = this.scale.height - map.heightInPixels

        const sBackgroundLayer = map.createLayer('SoftBackground', tileset1, chunkX, yOffset)
        const platformsLayer = map.createLayer('Platforms', tileset1, chunkX, yOffset)
        sBackgroundLayer.setDepth(0)
        platformsLayer.setDepth(2)
        platformsLayer.setCollisionByProperty({ colliders: true })

        this.solidLayers = this.solidLayers || []
        this.solidLayers.push(platformsLayer)

        let runnerSP = null
        if (key === 'chunk1') {
            const sp = map.findObject('SpawnPoint', o => o.name === 'Spawn')
            runnerSP = { x: sp.x + chunkX, y: sp.y + yOffset }
        }

        let hazardsLayer = null
        if (map.getLayer('Hazards')) {
            hazardsLayer = map.createLayer('Hazards', tileset2, chunkX, yOffset)
            hazardsLayer.setDepth(1)
            hazardsLayer.setCollisionByProperty({ hazard: true })
        }

        
        let platformCollider = null
        let hazardOverlap = null
        if (this.runner) {
            platformCollider = this.physics.add.collider(this.runner, platformsLayer)
            if (hazardsLayer) hazardOverlap = this.physics.add.overlap(this.runner, hazardsLayer, () => console.log('Hit Hazard'))
        }

        const markers = map.getObjectLayer('Markers')
        if (markers && markers.objects) {
            for (const obj of markers.objects) {
                if (obj.name !== 'SafeZone' && obj.name !== 'SlideZone') continue


                this.safeZones.push({
                    x: obj.x + chunkX,
                    y: obj.y + yOffset,
                    type: (obj.name === 'SlideZone') ? 'slide' : 'safe'
                })
            }
        }

        this.activeChunks.push({
            key,
            chunkX,
            map,
            platformsLayer,
            hazardsLayer,
            platformCollider,
            hazardOverlap
        })

        const worldH = Math.max(this.CHUNK_H_PX, this.scale.height)
        this.worldEndX = Math.max(this.worldEndX, chunkX + this.CHUNK_W_PX)
        this.physics.world.setBounds(0, 0, this.worldEndX, worldH)
        this.cameras.main.setBounds(0, 0, this.worldEndX, worldH)

        return { map, platformsLayer, hazardsLayer, runnerSP }
    }

    update() {
        if (this.runnerFSM) this.runnerFSM.step()

        const camRight = this.cameras.main.worldView.right
        if (camRight + this.PRELOAD_BUFFER >= this.worldEndX) {
            const nextKey = Phaser.Utils.Array.GetRandom(this.chunkKeys)
            if (this.oldKey !== nextKey) {
                this.spawnChunk(nextKey, this.worldEndX)
                this.oldKey = nextKey
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.DebugKey)) {
            const world = this.physics.world
            world.drawDebug = !world.drawDebug

            if (world.drawDebug) {
                world.debugGraphic.clear()
                world.drawDebug = true
            } else {
                world.debugGraphic.clear()
            }
        }

        this.freezeFrame.setPosition(this.runner.x, this.runner.y)
    }

}