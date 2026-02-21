class Menu extends Phaser.Scene {
    constructor() {
        super('Menu')
    }

    create() {
        const { width, height } = this.scale

        this.sky = this.add.image(0, 0, 'Sky')
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(-100)
        this.sky.setDisplaySize(width, height)

        this.mountains = this.add.tileSprite(0, 0, width, height, 'Mountains')
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(-50)
        this.mountains.y = 40

        this.add.rectangle(0, 0, width, height, 0x000000, 0.25)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(-10)

        const g = this.add.graphics().setScrollFactor(0).setDepth(-5)
        for (let i = 0; i < 80; i++) {
            g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.08, 0.25))
            g.fillCircle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 2)
            )
        }

        this.title = this.add.text(width * 0.5, height * 0.24, 'TEMPORAL\nFRAME', {
            fontFamily: 'Arial',
            fontSize: '72px',
            color: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setScrollFactor(0).setDepth(10)

        this.subtitle = this.add.text(width * 0.5, height * 0.46,
            'Obey the 6 frames.\nBreak the rule, pay the price.',
            {
                fontFamily: 'Arial',
                fontSize: '22px',
                color: '#cbd5ff',
                align: 'center',
                lineSpacing: 8
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(10)

        this.shadow = this.add.ellipse(width * 0.5, height * 0.9, 180, 26, 0x000000, 0.35)
            .setScrollFactor(0)
            .setDepth(9)

        this.muteHint = this.add.text(width - 12, height - 10, 'Click Mute', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#cbd5ff'
        }).setOrigin(1, 1).setScrollFactor(0).setDepth(10)

        this.add.text(12, height - 10, 'CMPM 120', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#cbd5ff'
        }).setOrigin(0, 1).setScrollFactor(0).setDepth(10)

        this.bgScroll = 0
        this.mode = 'menu'
        this.sound.mute = false

        this.buildMenuButtons()
        this.buildCreditsUI()
        this.buildInstructionsUI()
        this.showMenuUI()
    }

    buildMenuButtons() {
        const { width, height } = this.scale

        this.btnStart = this.makeButton(width * 0.5, height * 0.64, 'START', () => this.startGame())
        this.btnInstructions = this.makeButton(width * 0.5, height * 0.72, 'INSTRUCTIONS', () => this.showInstructionsUI())
        this.btnCredits = this.makeButton(width * 0.5, height * 0.80, 'CREDITS', () => this.showCreditsUI())
        this.btnMute = this.makeButton(width * 0.5, height * 0.88, 'MUTE', () => this.toggleMute())
    }

    buildCreditsUI() {
        const { width, height } = this.scale

        this.creditsTitle = this.add.text(width * 0.5, height * 0.20, 'CREDITS', {
            fontFamily: 'Arial',
            fontSize: '64px',
            color: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setScrollFactor(0).setDepth(10)

        this.creditsBody = this.add.text(width * 0.5, height * 0.50,
            [
                'Lead Programmer: Nikolas Huang',
                '',
                '',
                '',
                'ASSET CREDITS:',
                'Music: Dylan Lee',
                'Sprites: Mica Bicaldo',
                'Tiles: Shackhal',
                '',
                ''
            ].join('\n'),
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#cbd5ff',
                align: 'center',
                lineSpacing: 10
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(10)

        this.btnBackCredits = this.makeButton(width * 0.5, height * 0.84, 'BACK', () => this.showMenuUI())

        this.creditsTitle.setVisible(false)
        this.creditsBody.setVisible(false)
        this.btnBackCredits.setVisible(false)
    }

    buildInstructionsUI() {
        const { width, height } = this.scale

        this.instructionsTitle = this.add.text(width * 0.5, height * 0.18, 'INSTRUCTIONS', {
            fontFamily: 'Arial',
            fontSize: '56px',
            color: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setScrollFactor(0).setDepth(10)
        
        this.instructionsBody = this.add.text(
            width * 0.5,
            height * 0.52,
            [
                'CONTROLS:',
                '- Space: Jump',
                '- F: Projection (6-frame rule)',
                '- A / D: QTE inputs during projection',
                '',
                'HOW TO PLAY:',
                '- Keep running and survive as long as possible.',
                '- When Projection starts, you must input the 6-frame sequence correctly.',
                '- Each successful projection increases your base speed',
                '- If you break the rule, you freeze in frame and lose all your speed',
                '',
                '',
                'TOOLTIPS:',
                '- Projection allows you to go through walls!!!'
            ].join('\n'),
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#cbd5ff',
                align: 'center',
                lineSpacing: 10,
                wordWrap: { width: Math.min(720, width * 0.86) }
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(10)

        this.btnBackInstructions = this.makeButton(width * 0.5, height * 0.84, 'BACK', () => this.showMenuUI())

        this.instructionsTitle.setVisible(false)
        this.instructionsBody.setVisible(false)
        this.btnBackInstructions.setVisible(false)
    }

    makeButton(x, y, label, onClick) {
        const btn = this.add.text(x, y, label, {
            fontFamily: 'Arial',
            fontSize: '26px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { left: 18, right: 18, top: 10, bottom: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20)

        btn.setInteractive({ useHandCursor: true })

        btn.on('pointerover', () => {
            btn.setStyle({ backgroundColor: '#1b255a' })
            btn.setScale(1.03)
        })

        btn.on('pointerout', () => {
            btn.setStyle({ backgroundColor: '#000000' })
            btn.setScale(1.0)
        })

        btn.on('pointerdown', () => {
            this.cameras.main.flash(70, 255, 255, 255)
            onClick()
        })

        return btn
    }

    showMenuUI() {
        this.mode = 'menu'

        this.title.setVisible(true)
        this.subtitle.setVisible(true)
        this.shadow.setVisible(false)

        this.btnStart.setVisible(true)
        this.btnInstructions.setVisible(true)
        this.btnCredits.setVisible(true)
        this.btnMute.setVisible(true)

        this.creditsTitle.setVisible(false)
        this.creditsBody.setVisible(false)
        this.btnBackCredits.setVisible(false)

        this.instructionsTitle.setVisible(false)
        this.instructionsBody.setVisible(false)
        this.btnBackInstructions.setVisible(false)
    }

    showCreditsUI() {
        this.mode = 'credits'

        this.title.setVisible(false)
        this.subtitle.setVisible(false)
        this.shadow.setVisible(false)

        this.btnStart.setVisible(false)
        this.btnInstructions.setVisible(false)
        this.btnCredits.setVisible(false)
        this.btnMute.setVisible(false)

        this.creditsTitle.setVisible(true)
        this.creditsBody.setVisible(true)
        this.btnBackCredits.setVisible(true)

        this.instructionsTitle.setVisible(false)
        this.instructionsBody.setVisible(false)
        this.btnBackInstructions.setVisible(false)
    }

    showInstructionsUI() {
        this.mode = 'instructions'

        this.title.setVisible(false)
        this.subtitle.setVisible(false)
        this.shadow.setVisible(false)

        this.btnStart.setVisible(false)
        this.btnInstructions.setVisible(false)
        this.btnCredits.setVisible(false)
        this.btnMute.setVisible(false)

        this.creditsTitle.setVisible(false)
        this.creditsBody.setVisible(false)
        this.btnBackCredits.setVisible(false)

        this.instructionsTitle.setVisible(true)
        this.instructionsBody.setVisible(true)
        this.btnBackInstructions.setVisible(true)
    }

    toggleMute() {
        this.sound.mute = !this.sound.mute
        this.btnMute.setText(this.sound.mute ? 'UNMUTE' : 'MUTE')
        this.muteHint.setText(this.sound.mute ? 'Muted' : 'Sound On')
    }

    update(time, delta) {
        this.bgScroll += 0.012 * delta
        this.mountains.tilePositionX = this.bgScroll
    }

    startGame() {
        this.cameras.main.flash(120, 255, 255, 255)
        this.scene.start('Play')
    }
}