import type { AstroInstance } from 'astro';
import { Github, Twitter } from 'lucide-astro';

export interface SocialLink {
	name: string;
	url: string;
	icon: AstroInstance;
}

export default {
	title: 'OCS-festival Blog',
	favicon: 'favicon.ico',
	owner: 'Me1td0wn',
	profileImage: 'profile.webp', // Image in src/assets
	socialLinks: [
		{
			name: 'GitHub',
			url: 'https://github.com/rockem/astro-photography-portfolio',
			icon: Github,
		} as SocialLink,
		{
			name: 'Twitter',
			url: 'https://www.twitter.com/pretenders_001',
			icon: Twitter,
		} as SocialLink,
	],
};
