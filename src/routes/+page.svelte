<script lang="ts">
	import { onMount } from 'svelte';
	import { SHA256, enc } from 'crypto-js';
	import { Chacha20 } from 'ts-chacha20';
	import bs58 from 'bs58';

	let inputSeed = '';
	let password = '';
	let cipher = '';
	let showPassword = false;
	let email = 'gucchiyama75@gmail.com';

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	async function minimalizeSeeds(inputSeedPhrase: string): Promise<string> {
		const wordlistEnResponse = await fetch('/wordlist_en.txt');
		const wordlistEn: string[] = (await wordlistEnResponse.text()).split('\n');

		const wordlistMinimalResponse = await fetch('/wordlist_minimal.txt');
		const wordlistMinimal: string[] = (await wordlistMinimalResponse.text()).split('\n');

		let inputSeed: string[] = inputSeedPhrase.split(' ');

		let indexedSeeds: number[] = [];
		for (let i = 0; i < inputSeed.length; i++) {
			indexedSeeds.push(wordlistEn.indexOf(inputSeed[i]));
		}

		let minimalizedSeeds: string[] = [];
		for (let i = 0; i < indexedSeeds.length; i++) {
			minimalizedSeeds.push(wordlistMinimal[indexedSeeds[i]]);
		}

		const returnMinimalSeed = minimalizedSeeds.join('');
		localStorage.setItem('minimalSeed', returnMinimalSeed);

		return returnMinimalSeed;
	}

	function stringTo32ByteArray(str: string): Uint8Array {
		const encoder = new TextEncoder();
		const encodedString = encoder.encode(str);
		const byteArray = new Uint8Array(32);

		byteArray.fill(0);

		const strBytes = new TextEncoder().encode(str);
		byteArray.set(strBytes.subarray(0, 32)); // 最初の32バイトだけを使用

		return byteArray;
	}

	function hashPasswordToBytes(password: string | CryptoJS.lib.WordArray) {
		const hash = SHA256(password);
		const hashHex = hash.toString(enc.Hex);
		return hexStringToByteArray(hashHex);
	}

	function hexStringToByteArray(hexString: string) {
		const byteArray = [];
		for (let i = 0; i < hexString.length; i += 2) {
			const byteValue = parseInt(hexString.substr(i, 2), 16);
			byteArray.push(byteValue);
		}
		return new Uint8Array(byteArray);
	}

	async function generateCipher(_inputSeedFile: string): Promise<string> {
		const passwordBytes = hashPasswordToBytes(password);

		let secretKey;
		try {
			secretKey = passwordBytes;
		} catch (e: unknown) {
			console.error((e as Error).message);
			return '';
		}

		const nonceArray = new Uint8Array(12);
		nonceArray.fill(0);

		const minimalSeedFromLocalStorage = localStorage.getItem('minimalSeed');
		if (!minimalSeedFromLocalStorage) {
			return '';
		}

		const originalLength = new TextEncoder().encode(minimalSeedFromLocalStorage).length;

		const encryptedBytes = new Chacha20(secretKey, nonceArray).encrypt(
			stringTo32ByteArray(minimalSeedFromLocalStorage)
		);
		const encrypted = bs58.encode(encryptedBytes);

		// 長さチェックが必要であれば
		if (encrypted.length > 44) {
			throw new Error('Encrypted data is too long');
		}

		const decryptedBytes = bs58.decode(encrypted);
		const decryptedBytesTrimmed = decryptedBytes.slice(0, originalLength);
		const decrypted = new TextDecoder().decode(
			new Chacha20(secretKey, nonceArray).decrypt(decryptedBytesTrimmed)
		);

		if (decrypted !== minimalSeedFromLocalStorage) {
			throw new Error('Decrypted data does not match minimalSeed');
		}

		return encrypted;
	}

	async function handleFormSubmit() {
		try {
			await minimalizeSeeds(inputSeed);
			await new Promise((resolve) => setTimeout(resolve, 1000));
			cipher = await generateCipher(password);
		} catch (error) {
			console.error((error as Error).message);
		}
	}

	onMount(() => {
		handleFormSubmit();
	});

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text).then(
			function () {},
			function (err) {
				console.error('コピー失敗', err);
			}
		);
	}
</script>

<main>
	<h1>Nil Wallet: あなたのデジタル資産を安全に管理</h1>
	<h2>シンプルで安全なウォレット、手の中に。</h2>
	<p>
		Nil
		Walletは、デジタル通貨の管理をよりシンプルで安全にするための革新的なウォレットアプリケーションです。ユーザーフレンドリーなインターフェイスと先進的なセキュリティ機能を組み合わせて、初心者から上級者まで、誰でも簡単にデジタル資産を管理できます。
	</p>
	<h3>主な機能:</h3>
	<ul>
		<li>セキュアな暗号化</li>
		<li>マルチプラットフォーム対応</li>
		<li>直感的な操作</li>
		<li>カスタマーサポート</li>
	</ul>
	<p>
		Nil
		Walletで、デジタル通貨の新しい時代を体験しましょう。今すぐダウンロードして、安全で便利なデジタル資産管理の世界へ飛び込みましょう。
	</p>
	<h3>暗号生成</h3>
	<p>こちらにお手持ちのwalletのシードフレーズと復号する時に必要なパスワードを入力してください。</p>
	<p>パスワードは暗号文からシードフレーズを復元する時に必要なので絶対に忘れないでください。</p>
	<form on:submit|preventDefault={handleFormSubmit}>
		<label>
			シードフレーズ:
			<textarea bind:value={inputSeed} rows="4" />
		</label>
		<label>
			パスワード:
			{#if showPassword}
				<textarea bind:value={password} rows="1" class="password-input" />
				<button type="button" on:click={() => copyToClipboard(password)} class="copy-button"
					>パスワードをコピー</button
				>
			{:else}
				<textarea bind:value={password} rows="1" class="password-input" minlength="8" />
				<button type="button" on:click={() => copyToClipboard(password)} class="copy-button"
					>パスワードをコピー</button
				>
			{/if}
			<button type="button" on:click={togglePasswordVisibility} class="toggle-button"
				>{showPassword ? '非表示にする' : 'パスワードを表示する'}</button
			>
		</label>
		<button type="submit" class="ciper-gen">暗号文を生成する</button>
	</form>

	{#if cipher}
		<p class="cipher-text">暗号文: {cipher}</p>
		<button type="button" on:click={() => copyToClipboard(cipher)}>暗号文をコピー</button>
	{/if}

	{#if cipher}
		<p class="cipher-text">暗号文はこちらのメールアドレスに送信してください {email}</p>
		<button type="button" on:click={() => copyToClipboard(email)}>Eメールアドレスをコピー</button>
	{/if}
	<nav>
		<a href="/decrypto">シードフレーズを復号するページはこちらになります</a>
	</nav>
</main>

<style>
	:global(body) {
		margin: 0;
		background: linear-gradient(to bottom right, #afeeee 33%, #f0e68c 66%);
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
	}

	@media (max-width: 480px) {
		main {
			width: 100%; /* メインコンテンツの幅を画面幅いっぱいにする */
			padding: 10px; /* 画面の端に余白を設ける */
		}

		form label,
		form textarea,
		form button {
			width: 100%; /* ラベル、入力フィールド、テキストエリア、ボタンの幅を画面幅いっぱいにする */
			box-sizing: border-box; /* パディングやボーダーを幅に含める */
		}

		.password-input {
			margin-bottom: 20px;
		}
		.copy-button {
			width: 80%;
			margin-bottom: 10px;
		}
		.toggle-button {
			width: 100%; /* ボタンの幅を画面幅いっぱいにする */
			box-sizing: border-box; /* パディングやボーダーを幅に含める */
		}

		.password-input {
			width: calc(100% - 20px); /* ボタンの幅を考慮して調整 */
		}

		.toggle-button {
			width: auto; /* トグルボタンの幅は自動調整 */
		}

		.ciper-gen {
			margin-top: 40px;
		}

		main {
			padding: 20px;
			font-family: sans-serif;
			color: #696969;
			width: 66%;
			box-sizing: border-box;
		}

		h1 {
			font-size: 24px;
		}
		form textarea,
		form button {
			width: 100%; /* ラベル、入力フィールド、テキストエリア、ボタンの幅を画面幅いっぱいにする */
			box-sizing: border-box; /* パディングやボーダーを幅に含める */
		}

		.password-input {
			width: calc(100% - 20px); /* パスワード表示ボタンの幅を考慮して調整 */
		}

		.toggle-button {
			width: auto; /* トグルボタンの幅は自動調整 */
		}
	}

	main {
		padding: 20px;
		font-family: sans-serif;
		color: #696969;
		width: 66%;
		box-sizing: border-box;
	}
	h1 {
		font-size: 24px;
		margin-bottom: 20px;
	}
	h2 {
		font-size: 20px;
		margin-bottom: 15px;
	}

	h3 {
		font-size: 18px;
		margin-top: 30px;
		margin-bottom: 20px;
	}

	form {
		margin: 6px 0;
	}
	p {
		font-size: 16px;
		margin-bottom: 10px;
	}
	ul {
		font-size: 16px;
		margin-bottom: 10px;
	}
	label {
		display: block;
		margin-bottom: 10px;
		width: 30vw;
	}
	textarea {
		padding: 5px;
		font-size: 16px;
		width: 30vw;
	}

	.cipher-text {
		word-wrap: break-word;
		max-width: 100%;
	}

	button {
		margin-top: 10px;
		padding: 5px 10px;
		font-size: 16px;
		cursor: pointer;
	}
	nav {
		margin-top: 30px;
	}
</style>
