export interface Follow {
  follower: string;
  following: string;
  created_at: string;
  follower_image: string | null;
  following_image: string | null;
}

export interface User {
  id: number;
  username: string;
  date_joined: string;
  image: string;
  is_anonymous: boolean;
  email: string | null;  // null for non-staff users
  is_authenticated: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  followers: Follow[];
  following: Follow[];
  first_name: string | null;  // null for other users' profiles
  last_name: string | null;   // null for other users' profiles
}
