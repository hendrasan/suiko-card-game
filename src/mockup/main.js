// Dev-only mockup page (npm run dev, then open /mockup.html). Not part of the build.
import { mount } from 'svelte';
import '../app.css';
import Mockup from './Mockup.svelte';

mount(Mockup, { target: document.getElementById('app') });
