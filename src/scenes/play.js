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
        this.TILE = 16
        this.CHUNK_W_TILES = 48
        this.CHUNK_H_TILES = 32
        this.CHUNK_W_PX = this.TILE * this.CHUNK_W_TILES
        this.CHUNK_H_PX = this.TILE * this.CHUNK_H_TILES
        this.PRELOAD_BUFFER = 600

        this.activeChunks = []
        this.safeZones = []
        this.worldEndX = 0

        this.chunkKeys = ['chunk2']

        const { runnerSP, platformsLayer, hazardsLayer } = this.spawnChunk('chunk1', 0)
        this.runner = new Runner(this, runnerSP.x, runnerSP.y, 'testNaoya', 0)
        this.runner.body.setGravityY(800)
        this.runner.body.setCollideWorldBounds(true)

        this.cameras.main.startFollow(this.runner, true, 1, 1)
        this.cameras.main.setDeadzone(0, 0)
        this.cameras.main.setFollowOffset(-this.scale.width * 0.25, 0)
        this.cameras.main.setZoom(1.2)

        const worldH = Math.max(this.CHUNK_H_PX, this.scale.height)
        this.physics.world.setBounds(0, 0, this.worldEndX, worldH)
        this.cameras.main.setBounds(0, 0, this.worldEndX, worldH)

        this.physics.add.collider(this.runner, platformsLayer)

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

        const platformsLayer = map.createLayer('Platforms', tileset1, chunkX, yOffset)
        platformsLayer.setCollisionByProperty({ colliders: true })

        let runnerSP = null
        if (key === 'chunk1') {
            const sp = map.findObject('SpawnPoint', o => o.name === 'Spawn')
            runnerSP = { x: sp.x + chunkX, y: sp.y + yOffset }
        }

        let hazardsLayer = null
        if (map.getLayer('Hazards')) {
            hazardsLayer = map.createLayer('Hazards', tileset2, chunkX, yOffset)
            hazardsLayer.setCollisionByProperty({ hazard: true })
        }

        if (this.runner) {
            this.physics.add.collider(this.runner, platformsLayer)

            if (hazardsLayer) {
                this.physics.add.overlap(this.runner, hazardsLayer, () => console.log('Hit Hazard'))
            }
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
            hazardsLayer
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
            this.spawnChunk(nextKey, this.worldEndX)
        }
    }

}