/*
 * Nikolas Huang, CMPM 120, Feb 10
 * 
 *  Temporal Frame
 * 
 * Hours worked prediction: 5
 * 
 * 
 */

'use strict'

const config = {
    type: Phaser.AUTO,
    render: {
        pixelArt: true
    },
    width: 1280,
    height: 720,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scene: [ Load, Play ]
}

const game = new Phaser.Game(config)