export type Body_login_login_access_token = {
	grant_type?: string | null;
	username: string;
	password: string;
	scope?: string;
	client_id?: string | null;
	client_secret?: string | null;
};



export type Body_user_story_prompts_create_user_story_prompt = {
	prompt: string;
	category_id?: number | null;
	image?: Blob | File | null;
};



export type CategoriesPublic = {
	data: Array<CategoryPublic>;
	count: number;
};



export type CategoryCreate = {
	name: string;
	description?: string | null;
};



export type CategoryPublic = {
	name: string;
	description?: string | null;
	id: number;
};



export type CategoryUpdate = {
	name?: string | null;
	description?: string | null;
};



export type HTTPValidationError = {
	detail?: Array<ValidationError>;
};



export type ItemCreate = {
	title: string;
	description?: string | null;
};



export type ItemPublic = {
	title: string;
	description?: string | null;
	id: number;
	owner_id: number;
};



export type ItemUpdate = {
	title?: string | null;
	description?: string | null;
};



export type ItemsPublic = {
	data: Array<ItemPublic>;
	count: number;
};



export type Message = {
	message: string;
};



export type NewPassword = {
	token: string;
	new_password: string;
};



export type Token = {
	access_token: string;
	token_type?: string;
};



export type UpdatePassword = {
	current_password: string;
	new_password: string;
};



export type UserCreate = {
	email: string;
	is_active?: boolean;
	is_superuser?: boolean;
	full_name?: string | null;
	password: string;
};



export type UserPublic = {
	email: string;
	is_active?: boolean;
	is_superuser?: boolean;
	full_name?: string | null;
	id: number;
};



export type UserRegister = {
	email: string;
	password: string;
	full_name?: string | null;
};



export type UserStoryPromptPublic = {
	prompt: string;
	category_id?: number | null;
	image_id?: number | null;
	id: number;
	user_id: number;
};



export type UserStoryPromptUpdate = {
	prompt?: string | null;
	category_id?: number | null;
	image_id?: number | null;
};



export type UserStoryPromptsPublic = {
	data: Array<UserStoryPromptPublic>;
	count: number;
};



export type UserUpdate = {
	email?: string | null;
	is_active?: boolean;
	is_superuser?: boolean;
	full_name?: string | null;
	password?: string | null;
};



export type UserUpdateMe = {
	full_name?: string | null;
	email?: string | null;
};



export type UsersPublic = {
	data: Array<UserPublic>;
	count: number;
};



export type ValidationError = {
	loc: Array<string | number>;
	msg: string;
	type: string;
};

