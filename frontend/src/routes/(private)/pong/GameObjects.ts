class Rectangle {
	constructor(
		public x: number,
		public y: number,
		public width: number,
		public height: number,
	) {
		this.x = x
		this.y = y
		this.width = width
		this.height = height
	}
}

export class Paddle extends Rectangle {
	static speed = 1
	public color: string = "green"

	y0: number
	dy: number = 1

	constructor(x: number, y: number, w: number, h: number, color?: string, dy?: number) {
		super(x, y, w, h)
		this.y0 = y
		dy ? (this.dy = dy) : dy
		color ? (this.color = color) : color
	}

	static fromObject(obj: { x: number; y: number; w: number; h: number; color?: string }): Paddle {
		const newPaddle = new Paddle(obj.x, obj.x, obj.w, obj.h, obj.color)
		return newPaddle
	}

	update() {
		return (this.y += this.dy * Paddle.speed)
	}

	reset() {
		this.y = this.y0
		return this
	}
}

class Circle {
	constructor(
		public x: number,
		public y: number,
		public r: number,
	) {
		this.x = x
		this.y = y
		this.r = r
	}
}

export class Ball extends Circle {
	readonly x0: number
	readonly y0: number
	dx: number
	dy: number
	speed: number = 1
	initialSpeed: number = this.speed
	public color: string = "red"

	constructor(x: number, y: number, r: number, color?: string, speed?: number) {
		super(x, y, r)
		this.x0 = x
		this.y0 = y
		if (speed) {
			this.initialSpeed = speed
			this.speed = speed
		}
		this.color = color ?? this.color
		;[this.dx, this.dy] = this.start()
	}

	static fromObject(obj: {
		x: number
		y: number
		r: number
		color?: string
		speed?: number
	}): Ball {
		const newPaddle = new Ball(obj.x, obj.x, obj.r, obj.color, obj.speed)
		return newPaddle
	}

	private start(): [number, number] {
		const maxAngle = 90
		const angles = 5 // Number of potential random starting directions
		const angle = Math.floor(Math.random() * (angles + 1))

		const theta = ((angle * (maxAngle / angles) - 45) / 180) * Math.PI

		const dx = Math.cos(theta) * this.speed
		const dy = Math.sin(theta) * this.speed

		return [Math.random() > 0.5 ? dx : dx * -1, dy]
	}

	update(): [number, number] {
		return [(this.x += this.dx * this.speed), (this.y += this.dy * this.speed)]
	}

	//reset() : [number, number] {
	reset() {
		this.x = this.x0
		this.y = this.y0
		this.speed = this.initialSpeed
		;[this.dx, this.dy] = this.start()
		//return [ this.x = this.x0, this.y = this.y0, ]
		return this
	}

	collides(paddle: Rectangle) {
		const { x, y, r } = this
		if (
			x + r < paddle.x ||
			x - r > paddle.x + paddle.width ||
			y + r < paddle.y ||
			y - r > paddle.y + paddle.height
		) {
			return false
		}
		return true
	}
}
