export type Body_login_login_access_token = {
	grant_type?: string | null;
	username: string;
	password: string;
	scope?: string;
	client_id?: string | null;
	client_secret?: string | null;
};



export type Body_summaries_create_story_summary = {
	conversation_id: number;
};



export type Body_summaries_update_story_summary = {
	title?: string | null;
	summary_text?: string | null;
	image?: Blob | File | null;
};



export type Body_user_story_prompts_create_user_story_prompt = {
	prompt: string;
	category_id?: number | null;
	image?: Blob | File | null;
};



export type Body_user_story_prompts_update_user_story_prompt = {
	prompt?: string | null;
	category_id?: number | null;
	image?: Blob | File | null;
};



export type CategoriesPublic = {
	data: Array<CategoryPublic>;
	count: number;
};



export type Category = {
	id?: number | null;
	name: string;
	description?: string | null;
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



export type ChatMessage = {
	id?: number | null;
	conversation_id: number;
	sender_id: number;
	sender_type?: ChatMessageSender;
	content: string;
	timestamp?: string;
};



export type ChatMessageCreate = {
	sender_type: ChatMessageSender;
	content: string;
};



export type ChatMessagePublic = {
	sender_type: ChatMessageSender;
	content: string;
	id: number;
	timestamp: string;
};



export type ChatMessageSender = 'user' | 'ai' | 'final';



export type ChatMessagesPublic = {
	data: Array<ChatMessagePublic>;
	count: number;
};



export type Contact = {
	email: string;
	id?: number | null;
	user_id: number;
	created_at?: string;
};



export type ContactCreate = {
	email: string;
};



export type ContactRead = {
	email: string;
	id: number;
	created_at: string;
};



export type Conversation = {
	id?: number | null;
	user_id: number;
	user_story_prompt_id: number;
	created_at?: string;
	status?: ConversationStatus;
	token_total?: number;
};



export type ConversationCreate = {
	user_story_prompt_id: number;
};



export type ConversationPublic = {
	user_story_prompt_id: number;
	id: number;
	created_at: string;
	status?: ConversationStatus;
};



export type ConversationStatus = 'inactive' | 'active' | 'ready_for_summary' | 'complete';



export type ConversationsPublic = {
	data: Array<ConversationPublic>;
	count: number;
};



export type HTTPValidationError = {
	detail?: Array<ValidationError>;
};



export type ImageCreate = {
	link: string;
	description?: string | null;
	date?: string;
};



export type ImagePublic = {
	link: string;
	description?: string | null;
	date?: string;
	id: number;
};



export type ImageUpdate = {
	link?: string | null;
	description?: string | null;
	date?: string | null;
};



export type ImagesPublic = {
	data: Array<ImagePublic>;
	count: number;
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



export type NewPassword = {
	token: string;
	new_password: string;
};



export type StorySummary = {
	id?: number | null;
	conversation_id: number;
	user_id: number;
	title?: string | null;
	summary_text: string;
	created_at?: string;
	modified_at?: string | null;
	image_url?: string | null;
};



export type StorySummaryPublic = {
	id: number;
	conversation_id: number;
	title?: string | null;
	summary_text: string;
	image_url?: string | null;
	created_at: string;
	modified_at: string | null;
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
	user_story_prompts: Array<UserStoryPrompt>;
	conversations: Array<Conversation>;
	chat_messages: Array<ChatMessage>;
	story_summaries: Array<StorySummary>;
	contacts: Array<Contact>;
};



export type UserRegister = {
	email: string;
	password: string;
	full_name?: string | null;
};



export type UserStoryPrompt = {
	id?: number | null;
	prompt: string;
	user_id: number;
	category_id?: number | null;
	image_url?: string | null;
	created_at?: string | null;
	modified_at?: string | null;
};



export type UserStoryPromptPublic = {
	prompt: string;
	category_id?: number | null;
	image_url?: string | null;
	created_at: string | null;
	modified_at: string | null;
	id: number;
	user_id: number;
	category: Category | null;
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



export type app__llm__conversation_agent__Message = {
	content: string;
};



export type app__models__Message = {
	message: string;
};

