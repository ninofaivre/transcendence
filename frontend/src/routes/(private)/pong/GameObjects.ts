class Rectangle
{
	constructor( 
		public x : number,
		public y : number,
		public width : number,
		public height : number,
	) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
}

export class Paddle extends Rectangle {
	static speed = 1

	y0 : number
	dy: number

	constructor( x: number , y: number , w: number , h: number , dy = 1) {
		super(x, y, w, h)
		this.y0 = y;
		this.dy = dy;
	}

	update() {
		return (this.y += this.dy * Paddle.speed)
	}

	reset() {
		this.y = this.y0;
		return this;
	}
}

class Circle 
{
	constructor( 
		public x : number,
		public y : number,
		public r : number,
	) {
		this.x = x;
		this.y = y;
		this.r = r;
	}
}

export class Ball extends Circle
{
	readonly x0 : number
	readonly y0: number
	dx: number
	dy: number
	speed: number
	initialSpeed: number

	constructor( x: number , y: number, r: number , speed = 1)
	{
		super(x, y, r)
		this.x0 = x;
		this.y0 = y;
		this.initialSpeed = speed;
		this.speed = speed;
		[this.dx, this.dy] = this.start()
	}

	private start(): [number, number] {
		const maxAngle = 90;
		const angles = 5; // Number of potential random starting directions
		const angle = Math.floor(Math.random() * (angles + 1));

		const theta = ((angle * (maxAngle / angles) - 45) / 180) * Math.PI;

		const dx = Math.cos(theta) * this.speed;
		const dy = Math.sin(theta) * this.speed;

		return [ Math.random() > 0.5 ? dx : dx * -1, dy]
	}

	update(): [number, number] {
		return [ this.x += this.dx * this.speed,
				this.y += this.dy * this.speed, ]
	}

	//reset() : [number, number] {
	reset() {
		this.x = this.x0;
		this.y = this.y0;
		this.speed = this.initialSpeed;
		[this.dx, this.dy] = this.start();
		//return [ this.x = this.x0, this.y = this.y0, ]
		return this;
	}

	collides(paddle: Rectangle) {
		const { x, y, r } = this;
		if ( x + r < paddle.x
			|| x - r > paddle.x + paddle.width
			|| y + r < paddle.y
			|| y - r > paddle.y + paddle.height
		)
		{
			return false;
		}
		return true;
	}
}
