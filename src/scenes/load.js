class Load extends Phaser.Scene {
    constructor() {
        super('Load')
    }

    preload() {
        this.load.path = './assets/'

        this.load.audio('Freeze', 'FreezeFrame.mp3')

        this.load.image('devTiles', 'devTiles.png')
        this.load.image('TerrainTiles', 'Grassland_Terrain_Tileset.png')

        this.load.tilemapTiledJSON('devMap', 'dev_map.json')
        this.load.tilemapTiledJSON('chunk1', 'chunk1_platforming_mapV1.JSON')
        this.load.tilemapTiledJSON('chunk2', 'chunk2_slider_mapV1.JSON')
        this.load.tilemapTiledJSON('chunk3', 'chunk3_basic_mapV1.JSON')

        this.load.on('loaderror', (file) => console.log('LOAD ERROR:', file.src))

        this.load.image('testNaoya', 'devNaoya.png')

    }

    create() {
        this.scene.start('Play')
    }
    
}