<script>
	import { onMount } from 'svelte';

	onMount(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker
				.register('src/service-worker.js')
				.then((registration) => {
					console.log('Service Worker Registered:', registration);
				})
				.catch((error) => {
					console.error('Service Worker Registration Failed:', error);
				});
		}
	});
</script>

<slot />
