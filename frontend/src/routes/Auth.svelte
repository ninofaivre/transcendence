<script>
</script>

<div>
	<form method="POST" action="?/login">
		<label>
			Username
			<input name="username" type="username" required>
		</label>
		<label>
			Password
			<input name="password" type="password" required>
		</label>
		<button>Log in</button>
		<button formaction="?/register">Register</button>
	</form>
</div>

<style>
	div {
		position: absolute;
		top: 50%;
		left: 50%;
	}
</style>
