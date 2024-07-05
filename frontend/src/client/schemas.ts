export const $Body_login_login_access_token = {
	properties: {
		grant_type: {
	type: 'any-of',
	contains: [{
	type: 'string',
	pattern: 'password',
}, {
	type: 'null',
}],
},
		username: {
	type: 'string',
	isRequired: true,
},
		password: {
	type: 'string',
	isRequired: true,
},
		scope: {
	type: 'string',
	default: '',
},
		client_id: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		client_secret: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
	},
} as const;

export const $Body_summaries_create_story_summary = {
	properties: {
		conversation_id: {
	type: 'number',
	isRequired: true,
},
	},
} as const;

export const $Body_summaries_update_story_summary = {
	properties: {
		title: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		summary_text: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		image: {
	type: 'any-of',
	contains: [{
	type: 'binary',
	format: 'binary',
}, {
	type: 'null',
}],
},
	},
} as const;

export const $Body_user_story_prompts_create_user_story_prompt = {
	properties: {
		prompt: {
	type: 'string',
	isRequired: true,
},
		category_id: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		image: {
	type: 'any-of',
	contains: [{
	type: 'binary',
	format: 'binary',
}, {
	type: 'null',
}],
},
	},
} as const;

export const $Body_user_story_prompts_update_user_story_prompt = {
	properties: {
		prompt: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		category_id: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		image: {
	type: 'any-of',
	contains: [{
	type: 'binary',
	format: 'binary',
}, {
	type: 'null',
}],
},
	},
} as const;

export const $CategoriesPublic = {
	properties: {
		data: {
	type: 'array',
	contains: {
		type: 'CategoryPublic',
	},
	isRequired: true,
},
		count: {
	type: 'number',
	isRequired: true,
},
	},
} as const;

export const $Category = {
	properties: {
		id: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		name: {
	type: 'string',
	isRequired: true,
},
		description: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
	},
} as const;

export const $CategoryCreate = {
	properties: {
		name: {
	type: 'string',
	isRequired: true,
},
		description: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
	},
} as const;

export const $CategoryPublic = {
	properties: {
		name: {
	type: 'string',
	isRequired: true,
},
		description: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		id: {
	type: 'number',
	isRequired: true,
},
	},
} as const;

export const $CategoryUpdate = {
	properties: {
		name: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		description: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
	},
} as const;

export const $ChatMessage = {
	properties: {
		id: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		conversation_id: {
	type: 'number',
	isRequired: true,
},
		sender_id: {
	type: 'number',
	isRequired: true,
},
		sender_type: {
	type: 'all-of',
	contains: [{
	type: 'ChatMessageSender',
}],
},
		content: {
	type: 'string',
	isRequired: true,
},
		timestamp: {
	type: 'string',
	format: 'date-time',
},
	},
} as const;

export const $ChatMessageCreate = {
	properties: {
		sender_type: {
	type: 'ChatMessageSender',
	isRequired: true,
},
		content: {
	type: 'string',
	isRequired: true,
},
	},
} as const;

export const $ChatMessagePublic = {
	properties: {
		sender_type: {
	type: 'ChatMessageSender',
	isRequired: true,
},
		content: {
	type: 'string',
	isRequired: true,
},
		id: {
	type: 'number',
	isRequired: true,
},
		timestamp: {
	type: 'string',
	isRequired: true,
	format: 'date-time',
},
	},
} as const;

export const $ChatMessageSender = {
	type: 'Enum',
	enum: ['user','ai','final',],
} as const;

export const $ChatMessagesPublic = {
	properties: {
		data: {
	type: 'array',
	contains: {
		type: 'ChatMessagePublic',
	},
	isRequired: true,
},
		count: {
	type: 'number',
	isRequired: true,
},
	},
} as const;

export const $Conversation = {
	properties: {
		id: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		user_id: {
	type: 'number',
	isRequired: true,
},
		user_story_prompt_id: {
	type: 'number',
	isRequired: true,
},
		created_at: {
	type: 'string',
	format: 'date-time',
},
		status: {
	type: 'all-of',
	contains: [{
	type: 'ConversationStatus',
}],
},
		token_total: {
	type: 'number',
	default: 0,
},
	},
} as const;

export const $ConversationCreate = {
	properties: {
		user_story_prompt_id: {
	type: 'number',
	isRequired: true,
},
	},
} as const;

export const $ConversationPublic = {
	properties: {
		user_story_prompt_id: {
	type: 'number',
	isRequired: true,
},
		id: {
	type: 'number',
	isRequired: true,
},
		created_at: {
	type: 'string',
	isRequired: true,
	format: 'date-time',
},
		status: {
	type: 'all-of',
	contains: [{
	type: 'ConversationStatus',
}],
},
	},
} as const;

export const $ConversationStatus = {
	type: 'Enum',
	enum: ['inactive','active','ready_for_summary','complete',],
} as const;

export const $ConversationsPublic = {
	properties: {
		data: {
	type: 'array',
	contains: {
		type: 'ConversationPublic',
	},
	isRequired: true,
},
		count: {
	type: 'number',
	isRequired: true,
},
	},
} as const;

export const $HTTPValidationError = {
	properties: {
		detail: {
	type: 'array',
	contains: {
		type: 'ValidationError',
	},
},
	},
} as const;

export const $ImageCreate = {
	properties: {
		link: {
	type: 'string',
	isRequired: true,
},
		description: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		date: {
	type: 'string',
	format: 'date-time',
},
	},
} as const;

export const $ImagePublic = {
	properties: {
		link: {
	type: 'string',
	isRequired: true,
},
		description: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		date: {
	type: 'string',
	format: 'date-time',
},
		id: {
	type: 'number',
	isRequired: true,
},
	},
} as const;

export const $ImageUpdate = {
	properties: {
		link: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		description: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		date: {
	type: 'any-of',
	contains: [{
	type: 'string',
	format: 'date-time',
}, {
	type: 'null',
}],
},
	},
} as const;

export const $ImagesPublic = {
	properties: {
		data: {
	type: 'array',
	contains: {
		type: 'ImagePublic',
	},
	isRequired: true,
},
		count: {
	type: 'number',
	isRequired: true,
},
	},
} as const;

export const $ItemCreate = {
	properties: {
		title: {
	type: 'string',
	isRequired: true,
},
		description: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
	},
} as const;

export const $ItemPublic = {
	properties: {
		title: {
	type: 'string',
	isRequired: true,
},
		description: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		id: {
	type: 'number',
	isRequired: true,
},
		owner_id: {
	type: 'number',
	isRequired: true,
},
	},
} as const;

export const $ItemUpdate = {
	properties: {
		title: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		description: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
	},
} as const;

export const $ItemsPublic = {
	properties: {
		data: {
	type: 'array',
	contains: {
		type: 'ItemPublic',
	},
	isRequired: true,
},
		count: {
	type: 'number',
	isRequired: true,
},
	},
} as const;

export const $NewPassword = {
	properties: {
		token: {
	type: 'string',
	isRequired: true,
},
		new_password: {
	type: 'string',
	isRequired: true,
},
	},
} as const;

export const $StorySummary = {
	properties: {
		id: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		conversation_id: {
	type: 'number',
	isRequired: true,
},
		user_id: {
	type: 'number',
	isRequired: true,
},
		title: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		summary_text: {
	type: 'string',
	isRequired: true,
},
		created_at: {
	type: 'string',
	format: 'date-time',
},
		modified_at: {
	type: 'any-of',
	contains: [{
	type: 'string',
	format: 'date-time',
}, {
	type: 'null',
}],
},
		image_url: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
	},
} as const;

export const $StorySummaryPublic = {
	properties: {
		id: {
	type: 'number',
	isRequired: true,
},
		conversation_id: {
	type: 'number',
	isRequired: true,
},
		title: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		summary_text: {
	type: 'string',
	isRequired: true,
},
		image_url: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		created_at: {
	type: 'string',
	isRequired: true,
	format: 'date-time',
},
		modified_at: {
	type: 'any-of',
	contains: [{
	type: 'string',
	format: 'date-time',
}, {
	type: 'null',
}],
	isRequired: true,
},
	},
} as const;

export const $Token = {
	properties: {
		access_token: {
	type: 'string',
	isRequired: true,
},
		token_type: {
	type: 'string',
	default: 'bearer',
},
	},
} as const;

export const $UpdatePassword = {
	properties: {
		current_password: {
	type: 'string',
	isRequired: true,
},
		new_password: {
	type: 'string',
	isRequired: true,
},
	},
} as const;

export const $UserCreate = {
	properties: {
		email: {
	type: 'string',
	isRequired: true,
},
		is_active: {
	type: 'boolean',
	default: true,
},
		is_superuser: {
	type: 'boolean',
	default: false,
},
		full_name: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		password: {
	type: 'string',
	isRequired: true,
},
	},
} as const;

export const $UserPublic = {
	properties: {
		email: {
	type: 'string',
	isRequired: true,
},
		is_active: {
	type: 'boolean',
	default: true,
},
		is_superuser: {
	type: 'boolean',
	default: false,
},
		full_name: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		id: {
	type: 'number',
	isRequired: true,
},
		user_story_prompts: {
	type: 'array',
	contains: {
		type: 'UserStoryPrompt',
	},
	isRequired: true,
},
		conversations: {
	type: 'array',
	contains: {
		type: 'Conversation',
	},
	isRequired: true,
},
		chat_messages: {
	type: 'array',
	contains: {
		type: 'ChatMessage',
	},
	isRequired: true,
},
		story_summaries: {
	type: 'array',
	contains: {
		type: 'StorySummary',
	},
	isRequired: true,
},
	},
} as const;

export const $UserRegister = {
	properties: {
		email: {
	type: 'string',
	isRequired: true,
},
		password: {
	type: 'string',
	isRequired: true,
},
		full_name: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
	},
} as const;

export const $UserStoryPrompt = {
	properties: {
		id: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		prompt: {
	type: 'string',
	isRequired: true,
},
		user_id: {
	type: 'number',
	isRequired: true,
},
		category_id: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		image_url: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		created_at: {
	type: 'any-of',
	contains: [{
	type: 'string',
	format: 'date-time',
}, {
	type: 'null',
}],
},
		modified_at: {
	type: 'any-of',
	contains: [{
	type: 'string',
	format: 'date-time',
}, {
	type: 'null',
}],
},
	},
} as const;

export const $UserStoryPromptPublic = {
	properties: {
		prompt: {
	type: 'string',
	isRequired: true,
},
		category_id: {
	type: 'any-of',
	contains: [{
	type: 'number',
}, {
	type: 'null',
}],
},
		image_url: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		created_at: {
	type: 'any-of',
	contains: [{
	type: 'string',
	format: 'date-time',
}, {
	type: 'null',
}],
	isRequired: true,
},
		modified_at: {
	type: 'any-of',
	contains: [{
	type: 'string',
	format: 'date-time',
}, {
	type: 'null',
}],
	isRequired: true,
},
		id: {
	type: 'number',
	isRequired: true,
},
		user_id: {
	type: 'number',
	isRequired: true,
},
		category: {
	type: 'any-of',
	contains: [{
	type: 'Category',
}, {
	type: 'null',
}],
	isRequired: true,
},
	},
} as const;

export const $UserStoryPromptsPublic = {
	properties: {
		data: {
	type: 'array',
	contains: {
		type: 'UserStoryPromptPublic',
	},
	isRequired: true,
},
		count: {
	type: 'number',
	isRequired: true,
},
	},
} as const;

export const $UserUpdate = {
	properties: {
		email: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		is_active: {
	type: 'boolean',
	default: true,
},
		is_superuser: {
	type: 'boolean',
	default: false,
},
		full_name: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		password: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
	},
} as const;

export const $UserUpdateMe = {
	properties: {
		full_name: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
		email: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'null',
}],
},
	},
} as const;

export const $UsersPublic = {
	properties: {
		data: {
	type: 'array',
	contains: {
		type: 'UserPublic',
	},
	isRequired: true,
},
		count: {
	type: 'number',
	isRequired: true,
},
	},
} as const;

export const $ValidationError = {
	properties: {
		loc: {
	type: 'array',
	contains: {
	type: 'any-of',
	contains: [{
	type: 'string',
}, {
	type: 'number',
}],
},
	isRequired: true,
},
		msg: {
	type: 'string',
	isRequired: true,
},
		type: {
	type: 'string',
	isRequired: true,
},
	},
} as const;

export const $app__llm__conversation_agent__Message = {
	properties: {
		content: {
	type: 'string',
	isRequired: true,
},
	},
} as const;

export const $app__models__Message = {
	properties: {
		message: {
	type: 'string',
	isRequired: true,
},
	},
} as const;