import type { Link } from '@repo/prisma';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function getLinks(): Promise<Link[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/links`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch links');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching links:', error);
    return [];
  }
}

export async function getLink(id: number): Promise<Link | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/links/${id}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching link:', error);
    return null;
  }
}

