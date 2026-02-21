class Load extends Phaser.Scene {
    constructor() {
        super('Load')
    }

    preload() {
        this.load.path = './assets/'

        this.load.audio('Freeze', 'FreezeFrame.mp3')
        this.load.audio('bgMuix', 'SongRunning.mp3')
        this.load.audio('projectHit', 'POP2.WAV')
        this.load.audio('landsfx', 'landsfx.mp3')
        this.load.audio('hurt', 'hurt.mp3')
        this.load.audio('SHOUT', 'SHOUT.mp3')

        this.load.image('devTiles', 'devTiles.png')
        this.load.image('TerrainTiles', 'Grassland_Terrain_Tileset.png')
        this.load.image('FreezeFrame', 'FreezeFrame.png')
        this.load.image('Mountains', 'MountainsBackgrond.png')
        this.load.image('Sky', 'SkyBackground.png')

        this.load.tilemapTiledJSON('devMap', 'dev_map.json')
        this.load.tilemapTiledJSON('chunk1', 'chunk1_platforming_mapV1.JSON')
        this.load.tilemapTiledJSON('chunk2', 'chunk2_slider_mapV1.JSON')
        this.load.tilemapTiledJSON('chunk3', 'chunk3_basic_mapV1.JSON')
        this.load.tilemapTiledJSON('chunk4', 'chunk4_air_mapV1.JSON')
        this.load.tilemapTiledJSON('chunk5', 'chunk5_airV2_mapV1.JSON')

        this.load.image('testNaoya', 'devNaoya.png')

        this.load.spritesheet('naoya', 'NaoyaSprite.png', {
            frameWidth: 200,
            frameHeight: 200
        })

    }

    create() {
        this.scene.start('Menu')
    }
    
}