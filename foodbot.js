export default class FoodBot {
  constructor(grid) {
  	// initiate fields
    this.grid = grid;
  	this.text = [];
  	this.volatility = undefined;
  	this.pc = 0;
  	this.mem = {a: 0, b: 0};
  	this.dir = 0;
  	this.pos = {
  		x: Math.floor(this.grid.width * Math.random()),
  		y: Math.floor(this.grid.height * Math.random())
  	};
  	this.life = FoodBot.LIFETIME;
  	this.food = 0;
  }

	// load random code
	init() {
		while(this.text.length < 256) {
			this.text.push(Math.floor(7 * Math.random()));
		}
	}

	// life of the bot
  run() {
		if(this.isDead()) {
			console.log('already dead');
			return;
		}

		// perform action
		switch(this.text[this.pc]) {
			case 0:	// left
				this.dir = (this.dir + 1) % 4;
				break;
			case 1:	// right
				this.dir = (this.dir + 3) % 4;
				break;
			case 2:	// forward
				this.pos.x = (this.pos.x + (this.dir % 2 > 0 ? 0 : 1 - this.dir) + this.grid.width) % this.grid.width;
				this.pos.y = (this.pos.y + (this.dir % 2 > 0 ? this.dir - 2 : 0) + this.grid.height) % this.grid.height;
				if(this.grid.get(this.pos.x, this.pos.y)) {
					this.food++;
					this.grid.set(this.pos.x, this.pos.y, false);
				}
				break;
			case 3:	// sensor
				this.mem.b = this.mem.a;
				this.mem.a = this.sense();
				break;
			case 4:	// marks label
				// nop
				break;
			case 5:	// prev if a<b
				if(this.mem.a < this.mem.b) {
					while(this.pc >= 0) {
						if(this.text[this.pc] == 4) {
							break;
						}
						this.pc--;
					}
				}
				break;
			case 6:	// next if a<b
				if(this.mem.a < this.mem.b) {
					while(this.pc < this.text.length) {
						if(this.text[this.pc] == 4) {
							break;
						}
						this.pc++;
					}
				}
				break;
			default:
				console.log('Invalid code:', this.text[this.pc]);
		}

		if(this.pc == this.text.length) {
			// halt
			this.life = 0;
		} else {
			this.pc++;
			this.life--;
		}
	}

	// can the bot not run any longer?
	isDead() {
		return this.life <= 0 || this.pc >= this.text.length;
	}

	// give feedback to the bot for finding food in line of sight
	sense() {
		let x = this.pos.x;
		let y = this.pos.y;
		let dist = 0;
		let found = false;

		// look down the bot's line of sight for the closest food
		do {
			const h = this.dir % 2 > 0 ? 0 : 1 - this.dir;
			const k = this.dir % 2 > 0 ? this.dir - 2 : 0;

			x = (x + h) % this.grid.width;
			y = (y + k) % this.grid.height;
			dist++;

			if(this.grid.get(x, y)) {
				found = true;
				break;
			}
		} while(x != this.pos.x && y != this.pos.y);

		// return distance to food, or 0 if not found
		return found ? dist : 0;
	}

	// the fitness function
	getFitness() {
		return this.food;
	}

	// reproduction, mixing of genes to produce offspring
	crossover(bot) {
		// change to model meiosis
		const child = new FoodBot(this.grid);
		const myFit = this.getFitness();
		const botFit = bot.getFitness();
		const sum = myFit > 0 || botFit > 0 ? myFit + botFit : 1;

		child.volatility = (this.volatility * myFit + bot.volatility * botFit) / sum;
		for(let i = 0; i < this.text.length; i++) {
			if(Math.random() < 0.5) {
				child.text.push(this.text[i]);
			} else {
				child.text.push(bot.text[i]);
			}
		}
		return child;
	}

	// add more diversity to the gene pool
	mutate(rate) {
		const chance = rate / 2 + rate * this.volatility;
		for(let i = 0; i < this.text.length; i++) {
			if(Math.random() < chance) {
				this.text[i] = Math.floor(7 * Math.random());
			}
		}
	}

	// prettify my own tags
	toHTML() {
		const commands = [
			{type: 'move', name: 'TURN_L'},
			{type: 'move', name: 'TURN_R'},
			{type: 'move', name: 'MOVE_F'},
			{type: 'sensor', name: 'SENSE'},
			{type: 'label', name: 'LABEL'},
			{type: 'jump', name: 'PREV_LT'},
			{type: 'jump', name: 'NEXT_LT'}
		];
		let program = '';
		for(let i = 0; i < this.text.length; i++) {
			const command = commands[this.text[i]];
			program += '<span data-code=\"' + command.type + '\">' + command.name + '</span>';
			if(i != this.text.length - 1) {
				program += ', ';
			}
		}
		return program;
	}
}
FoodBot.LIFETIME = 512;
