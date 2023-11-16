<script lang="ts">
	import { onMount } from 'svelte';
	import bs58 from 'bs58';
	import { Chacha20 } from 'ts-chacha20';
	import { SHA256, enc } from 'crypto-js';

	let inputCipher = '';
	let password = '';
	let seedPhrase = '';

	function hashPasswordToBytes(password: string | CryptoJS.lib.WordArray) {
		try {
			const hash = SHA256(password);
			const hashHex = hash.toString(enc.Hex);
			return hexStringToByteArray(hashHex);
		} catch (e) {
			console.error('Error in hashPasswordToBytes: ', e);
			return new Uint8Array();
		}
	}

	function hexStringToByteArray(hexString: string) {
		const byteArray = [];
		for (let i = 0; i < hexString.length; i += 2) {
			const byteValue = parseInt(hexString.slice(i, i + 2), 16);
			byteArray.push(byteValue);
		}
		return new Uint8Array(byteArray);
	}

	async function recoverSeed(): Promise<string> {
		// パスワードをSHA-256でハッシュ化して32バイトのキーを生成
		const secret = hashPasswordToBytes(password);

		// ノンスを12バイトのゼロで初期化
		const nonce = new Uint8Array(12);
		nonce.fill(0);

		const wordlistEnResponse = await fetch('/wordlist_en.txt');
		const wordlistEn: string[] = (await wordlistEnResponse.text()).split('\n');

		const wordlistMinimalResponse = await fetch('/wordlist_minimal.txt');
		const wordlistMinimal: string[] = (await wordlistMinimalResponse.text()).split('\n');

		const inputCipherValue = inputCipher.trim();

		// Base58でエンコードされた暗号文をデコード
		const cipherBytes = bs58.decode(inputCipherValue);

		// 復号化処理
		const minimalSeedBytes = new Chacha20(secret, nonce).decrypt(cipherBytes);
		const minimalSeed = new TextDecoder().decode(minimalSeedBytes);

		// 復号化されたシードフレーズを元の単語リストに変換
		const minimalSeedWords = []; // 単語を格納するための配列
		for (let i = 0; i < minimalSeed.length; i += 2) {
			minimalSeedWords.push(minimalSeed.substring(i, i + 2));
		}
		const recoveredSeedWords = minimalSeedWords.map((minimalWord) => {
			const index = wordlistMinimal.indexOf(minimalWord);

			return wordlistEn[index];
		});

		const recoveredSeed = recoveredSeedWords.join(' ').trim();

		return recoveredSeed || '';
	}

	async function handleFormSubmit() {
		seedPhrase = await recoverSeed();
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
	<h1>Nil Wallet: 暗号復号</h1>
	<h3>シードフレーズの復号</h3>
	<p>
		こちらのページでは、暗号化されたシードフレーズを復号することができます。暗号文とパスワードを入力して「復号する」ボタンをクリックしてください。
	</p>
	<p>パスワードは暗号化時に設定したものを使用してください。</p>
	<form on:submit|preventDefault={handleFormSubmit}>
		<label>
			<span>暗号文:</span>
			<textarea bind:value={inputCipher} rows="3" />
		</label>
		<label>
			<span>パスワード:</span>
			<input type="text" bind:value={password} />
		</label>
		<button type="submit">復号する</button>
	</form>

		{#if seedPhrase}
		<p class="cipher-text">シードフレーズ: {seedPhrase}</p>
		<button type="button" on:click={() => copyToClipboard(seedPhrase)}>シードフレーズをコピー</button>
	{/if}

	<nav>
		<a href="/">暗号化ページに戻る</a>
	</nav>
</main>

<style>

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
	}
	:global(body) {
		margin: 0;
		background: linear-gradient(to bottom right, #afeeee 33%, #f0e68c 66%);
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
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
	h3 {
		font-size: 18px;
		margin-bottom: 10px;
	}
	p {
		font-size: 16px;
		margin-bottom: 50px;
	}
	label {
	display: block;
	margin-bottom: 10px;
	width: 35vw;
}

label > span {
	display: block; /* ラベルのテキストをブロック要素として表示 */
	margin-bottom: 5px;

}

input, textarea {
	padding: 5px;
	font-size: 16px;
	width: 100%; /* 入力フィールドの幅を100%に設定 */
}
	button {
		margin-top: 20px;
		padding: 5px 10px;
		font-size: 16px;
		cursor: pointer;
	}

	nav {
		margin-top: 20px;
	}
	a {
		color: #0000ff;
	}
</style>
