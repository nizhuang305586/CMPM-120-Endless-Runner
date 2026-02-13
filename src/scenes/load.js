class Load extends Phaser.Scene {
    constructor() {
        super('Load')
    }

    preload() {
        this.load.tilemapTiledJSON('devMap', 'assets/dev_map.json')
        this.load.image('devTiles', 'assets/devTiles.png')
        this.load.on('loaderror', (file) => console.log('LOAD ERROR:', file.src))

    }

    create() {
        this.scene.start('Play')
    }
    
}