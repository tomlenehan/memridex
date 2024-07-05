import type { CancelablePromise } from './core/CancelablePromise';
import { OpenAPI } from './core/OpenAPI';
import { request as __request } from './core/request';

import type { app__models__Message,Body_login_login_access_token,NewPassword,Token,UserPublic,UpdatePassword,UserCreate,UserRegister,UsersPublic,UserUpdate,UserUpdateMe,ItemCreate,ItemPublic,ItemsPublic,ItemUpdate,ConversationCreate,ConversationPublic,ConversationsPublic,app__llm__conversation_agent__Message,ChatMessageCreate,ChatMessagePublic,ChatMessagesPublic,Body_user_story_prompts_create_user_story_prompt,Body_user_story_prompts_update_user_story_prompt,UserStoryPromptPublic,UserStoryPromptsPublic,Body_summaries_create_story_summary,Body_summaries_update_story_summary,StorySummaryPublic,CategoriesPublic,CategoryCreate,CategoryPublic,CategoryUpdate,ImageCreate,ImagePublic,ImagesPublic,ImageUpdate } from './models';

export type TDataLoginAccessToken = {
                formData: Body_login_login_access_token
                
            }
export type TDataRecoverPassword = {
                email: string
                
            }
export type TDataResetPassword = {
                requestBody: NewPassword
                
            }
export type TDataRecoverPasswordHtmlContent = {
                email: string
                
            }

export class LoginService {

	/**
	 * Login Access Token
	 * OAuth2 compatible token login, get an access token for future requests
	 * @returns Token Successful Response
	 * @throws ApiError
	 */
	public static loginAccessToken(data: TDataLoginAccessToken): CancelablePromise<Token> {
		const {
formData,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/login/access-token',
			formData: formData,
			mediaType: 'application/x-www-form-urlencoded',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Test Token
	 * Test access token
	 * @returns UserPublic Successful Response
	 * @throws ApiError
	 */
	public static testToken(): CancelablePromise<UserPublic> {
				return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/login/test-token',
		});
	}

	/**
	 * Recover Password
	 * Password Recovery
	 * @returns app__models__Message Successful Response
	 * @throws ApiError
	 */
	public static recoverPassword(data: TDataRecoverPassword): CancelablePromise<app__models__Message> {
		const {
email,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/password-recovery/{email}',
			path: {
				email
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Reset Password
	 * Reset password
	 * @returns app__models__Message Successful Response
	 * @throws ApiError
	 */
	public static resetPassword(data: TDataResetPassword): CancelablePromise<app__models__Message> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/reset-password/',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Recover Password Html Content
	 * HTML Content for Password Recovery
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static recoverPasswordHtmlContent(data: TDataRecoverPasswordHtmlContent): CancelablePromise<string> {
		const {
email,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/password-recovery-html-content/{email}',
			path: {
				email
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

}

export type TDataReadUsers = {
                limit?: number
skip?: number
                
            }
export type TDataCreateUser = {
                requestBody: UserCreate
                
            }
export type TDataUpdateUserMe = {
                requestBody: UserUpdateMe
                
            }
export type TDataUpdatePasswordMe = {
                requestBody: UpdatePassword
                
            }
export type TDataRegisterUser = {
                requestBody: UserRegister
                
            }
export type TDataReadUserById = {
                userId: number
                
            }
export type TDataUpdateUser = {
                requestBody: UserUpdate
userId: number
                
            }
export type TDataDeleteUser = {
                userId: number
                
            }

export class UsersService {

	/**
	 * Read Users
	 * Retrieve users.
	 * @returns UsersPublic Successful Response
	 * @throws ApiError
	 */
	public static readUsers(data: TDataReadUsers = {}): CancelablePromise<UsersPublic> {
		const {
limit = 100,
skip = 0,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/users/',
			query: {
				skip, limit
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Create User
	 * Create new user.
	 * @returns UserPublic Successful Response
	 * @throws ApiError
	 */
	public static createUser(data: TDataCreateUser): CancelablePromise<UserPublic> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/users/',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Read User Me
	 * Get current user.
	 * @returns UserPublic Successful Response
	 * @throws ApiError
	 */
	public static readUserMe(): CancelablePromise<UserPublic> {
				return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/users/me',
		});
	}

	/**
	 * Delete User Me
	 * Delete own user.
	 * @returns app__models__Message Successful Response
	 * @throws ApiError
	 */
	public static deleteUserMe(): CancelablePromise<app__models__Message> {
				return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/users/me',
		});
	}

	/**
	 * Update User Me
	 * Update own user.
	 * @returns UserPublic Successful Response
	 * @throws ApiError
	 */
	public static updateUserMe(data: TDataUpdateUserMe): CancelablePromise<UserPublic> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PATCH',
			url: '/api/v1/users/me',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Update Password Me
	 * Update own password.
	 * @returns app__models__Message Successful Response
	 * @throws ApiError
	 */
	public static updatePasswordMe(data: TDataUpdatePasswordMe): CancelablePromise<app__models__Message> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PATCH',
			url: '/api/v1/users/me/password',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Register User
	 * Create new user without the need to be logged in.
	 * @returns UserPublic Successful Response
	 * @throws ApiError
	 */
	public static registerUser(data: TDataRegisterUser): CancelablePromise<UserPublic> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/users/signup',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Read User By Id
	 * Get a specific user by id.
	 * @returns UserPublic Successful Response
	 * @throws ApiError
	 */
	public static readUserById(data: TDataReadUserById): CancelablePromise<UserPublic> {
		const {
userId,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/users/{user_id}',
			path: {
				user_id: userId
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Update User
	 * Update a user.
	 * @returns UserPublic Successful Response
	 * @throws ApiError
	 */
	public static updateUser(data: TDataUpdateUser): CancelablePromise<UserPublic> {
		const {
requestBody,
userId,
} = data;
		return __request(OpenAPI, {
			method: 'PATCH',
			url: '/api/v1/users/{user_id}',
			path: {
				user_id: userId
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Delete User
	 * Delete a user.
	 * @returns app__models__Message Successful Response
	 * @throws ApiError
	 */
	public static deleteUser(data: TDataDeleteUser): CancelablePromise<app__models__Message> {
		const {
userId,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/users/{user_id}',
			path: {
				user_id: userId
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

}

export type TDataTestEmail = {
                emailTo: string
                
            }

export class UtilsService {

	/**
	 * Test Email
	 * Test emails.
	 * @returns app__models__Message Successful Response
	 * @throws ApiError
	 */
	public static testEmail(data: TDataTestEmail): CancelablePromise<app__models__Message> {
		const {
emailTo,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/utils/test-email/',
			query: {
				email_to: emailTo
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

}

export type TDataReadItems = {
                limit?: number
skip?: number
                
            }
export type TDataCreateItem = {
                requestBody: ItemCreate
                
            }
export type TDataReadItem = {
                id: number
                
            }
export type TDataUpdateItem = {
                id: number
requestBody: ItemUpdate
                
            }
export type TDataDeleteItem = {
                id: number
                
            }

export class ItemsService {

	/**
	 * Read Items
	 * Retrieve items.
	 * @returns ItemsPublic Successful Response
	 * @throws ApiError
	 */
	public static readItems(data: TDataReadItems = {}): CancelablePromise<ItemsPublic> {
		const {
limit = 100,
skip = 0,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/items/',
			query: {
				skip, limit
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Create Item
	 * Create new item.
	 * @returns ItemPublic Successful Response
	 * @throws ApiError
	 */
	public static createItem(data: TDataCreateItem): CancelablePromise<ItemPublic> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/items/',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Read Item
	 * Get item by ID.
	 * @returns ItemPublic Successful Response
	 * @throws ApiError
	 */
	public static readItem(data: TDataReadItem): CancelablePromise<ItemPublic> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/items/{id}',
			path: {
				id
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Update Item
	 * Update an item.
	 * @returns ItemPublic Successful Response
	 * @throws ApiError
	 */
	public static updateItem(data: TDataUpdateItem): CancelablePromise<ItemPublic> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/v1/items/{id}',
			path: {
				id
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Delete Item
	 * Delete an item.
	 * @returns app__models__Message Successful Response
	 * @throws ApiError
	 */
	public static deleteItem(data: TDataDeleteItem): CancelablePromise<app__models__Message> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/items/{id}',
			path: {
				id
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

}

export type TDataCreateConversation = {
                requestBody: ConversationCreate
                
            }
export type TDataReadConversations = {
                limit?: number
skip?: number
                
            }
export type TDataReadConversation = {
                id: number
                
            }
export type TDataUpdateConversation = {
                id: number
requestBody: ConversationCreate
                
            }
export type TDataDeleteConversation = {
                id: number
                
            }

export class ConversationsService {

	/**
	 * Create Conversation
	 * @returns ConversationPublic Successful Response
	 * @throws ApiError
	 */
	public static createConversation(data: TDataCreateConversation): CancelablePromise<ConversationPublic> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/conversations/',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Read Conversations
	 * @returns ConversationsPublic Successful Response
	 * @throws ApiError
	 */
	public static readConversations(data: TDataReadConversations = {}): CancelablePromise<ConversationsPublic> {
		const {
limit = 100,
skip = 0,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/conversations/',
			query: {
				skip, limit
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Read Conversation
	 * @returns ConversationPublic Successful Response
	 * @throws ApiError
	 */
	public static readConversation(data: TDataReadConversation): CancelablePromise<ConversationPublic> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/conversations/{id}',
			path: {
				id
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Update Conversation
	 * @returns ConversationPublic Successful Response
	 * @throws ApiError
	 */
	public static updateConversation(data: TDataUpdateConversation): CancelablePromise<ConversationPublic> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/v1/conversations/{id}',
			path: {
				id
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Delete Conversation
	 * @returns app__models__Message Successful Response
	 * @throws ApiError
	 */
	public static deleteConversation(data: TDataDeleteConversation): CancelablePromise<app__models__Message> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/conversations/{id}',
			path: {
				id
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

}

export type TDataCreateChatMessage = {
                conversationId: number
requestBody: ChatMessageCreate
                
            }
export type TDataReadChatMessages = {
                conversationId: number
limit?: number
skip?: number
                
            }
export type TDataGetSummary = {
                conversationId: number
                
            }
export type TDataReadChatMessage = {
                conversationId: number
messageId: number
                
            }
export type TDataDeleteChatMessage = {
                conversationId: number
messageId: number
                
            }

export class ChatMessagesService {

	/**
	 * Create Chat Message
	 * @returns ChatMessagePublic Successful Response
	 * @throws ApiError
	 */
	public static createChatMessage(data: TDataCreateChatMessage): CancelablePromise<ChatMessagePublic> {
		const {
conversationId,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/chat_messages/{conversation_id}/messages',
			path: {
				conversation_id: conversationId
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Read Chat Messages
	 * @returns ChatMessagesPublic Successful Response
	 * @throws ApiError
	 */
	public static readChatMessages(data: TDataReadChatMessages): CancelablePromise<ChatMessagesPublic> {
		const {
conversationId,
limit = 100,
skip = 0,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/chat_messages/{conversation_id}/messages',
			path: {
				conversation_id: conversationId
			},
			query: {
				skip, limit
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Get Summary
	 * @returns ChatMessagePublic Successful Response
	 * @throws ApiError
	 */
	public static getSummary(data: TDataGetSummary): CancelablePromise<ChatMessagePublic> {
		const {
conversationId,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/chat_messages/{conversation_id}/summary',
			path: {
				conversation_id: conversationId
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Read Chat Message
	 * @returns ChatMessagePublic Successful Response
	 * @throws ApiError
	 */
	public static readChatMessage(data: TDataReadChatMessage): CancelablePromise<ChatMessagePublic> {
		const {
conversationId,
messageId,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/chat_messages/{conversation_id}/messages/{message_id}',
			path: {
				conversation_id: conversationId, message_id: messageId
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Delete Chat Message
	 * @returns app__llm__conversation_agent__Message Successful Response
	 * @throws ApiError
	 */
	public static deleteChatMessage(data: TDataDeleteChatMessage): CancelablePromise<app__llm__conversation_agent__Message> {
		const {
conversationId,
messageId,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/chat_messages/{conversation_id}/messages/{message_id}',
			path: {
				conversation_id: conversationId, message_id: messageId
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

}

export type TDataReadUserStoryPrompts = {
                limit?: number
skip?: number
                
            }
export type TDataCreateUserStoryPrompt = {
                formData: Body_user_story_prompts_create_user_story_prompt
                
            }
export type TDataReadUserStoryPrompt = {
                id: number
                
            }
export type TDataUpdateUserStoryPrompt = {
                formData?: Body_user_story_prompts_update_user_story_prompt
id: number
                
            }
export type TDataDeleteUserStoryPrompt = {
                id: number
                
            }

export class UserStoryPromptsService {

	/**
	 * Read User Story Prompts
	 * Retrieve user story prompts.
	 * @returns UserStoryPromptsPublic Successful Response
	 * @throws ApiError
	 */
	public static readUserStoryPrompts(data: TDataReadUserStoryPrompts = {}): CancelablePromise<UserStoryPromptsPublic> {
		const {
limit = 100,
skip = 0,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/user_story_prompts/',
			query: {
				skip, limit
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Create User Story Prompt
	 * Create new user story prompt.
	 * @returns UserStoryPromptPublic Successful Response
	 * @throws ApiError
	 */
	public static createUserStoryPrompt(data: TDataCreateUserStoryPrompt): CancelablePromise<UserStoryPromptPublic> {
		const {
formData,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/user_story_prompts/',
			formData: formData,
			mediaType: 'multipart/form-data',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Read User Story Prompt
	 * Get user story prompt by ID.
	 * @returns UserStoryPromptPublic Successful Response
	 * @throws ApiError
	 */
	public static readUserStoryPrompt(data: TDataReadUserStoryPrompt): CancelablePromise<UserStoryPromptPublic> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/user_story_prompts/{id}',
			path: {
				id
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Update User Story Prompt
	 * Update a user story prompt.
	 * @returns UserStoryPromptPublic Successful Response
	 * @throws ApiError
	 */
	public static updateUserStoryPrompt(data: TDataUpdateUserStoryPrompt): CancelablePromise<UserStoryPromptPublic> {
		const {
formData,
id,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/v1/user_story_prompts/{id}',
			path: {
				id
			},
			formData: formData,
			mediaType: 'multipart/form-data',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Delete User Story Prompt
	 * Delete a user story prompt.
	 * @returns app__models__Message Successful Response
	 * @throws ApiError
	 */
	public static deleteUserStoryPrompt(data: TDataDeleteUserStoryPrompt): CancelablePromise<app__models__Message> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/user_story_prompts/{id}',
			path: {
				id
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

}

export type TDataReadStorySummaries = {
                limit?: number
skip?: number
                
            }
export type TDataCreateStorySummary = {
                formData: Body_summaries_create_story_summary
                
            }
export type TDataReadStorySummary = {
                id: number
                
            }
export type TDataUpdateStorySummary = {
                formData?: Body_summaries_update_story_summary
id: number
                
            }
export type TDataDeleteStorySummary = {
                id: number
                
            }

export class SummariesService {

	/**
	 * Read Story Summaries
	 * Retrieve story summaries.
	 * @returns StorySummaryPublic Successful Response
	 * @throws ApiError
	 */
	public static readStorySummaries(data: TDataReadStorySummaries = {}): CancelablePromise<Array<StorySummaryPublic>> {
		const {
limit = 100,
skip = 0,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/summaries/',
			query: {
				skip, limit
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Create Story Summary
	 * @returns StorySummaryPublic Successful Response
	 * @throws ApiError
	 */
	public static createStorySummary(data: TDataCreateStorySummary): CancelablePromise<StorySummaryPublic> {
		const {
formData,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/summaries/',
			formData: formData,
			mediaType: 'application/x-www-form-urlencoded',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Read Story Summary
	 * Get story summary by ID.
	 * @returns StorySummaryPublic Successful Response
	 * @throws ApiError
	 */
	public static readStorySummary(data: TDataReadStorySummary): CancelablePromise<StorySummaryPublic> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/summaries/{id}',
			path: {
				id
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Update Story Summary
	 * Update a story summary.
	 * @returns StorySummaryPublic Successful Response
	 * @throws ApiError
	 */
	public static updateStorySummary(data: TDataUpdateStorySummary): CancelablePromise<StorySummaryPublic> {
		const {
formData,
id,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/v1/summaries/{id}',
			path: {
				id
			},
			formData: formData,
			mediaType: 'multipart/form-data',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Delete Story Summary
	 * Delete a story summary.
	 * @returns app__models__Message Successful Response
	 * @throws ApiError
	 */
	public static deleteStorySummary(data: TDataDeleteStorySummary): CancelablePromise<app__models__Message> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/summaries/{id}',
			path: {
				id
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

}

export type TDataReadCategories = {
                limit?: number
skip?: number
                
            }
export type TDataCreateCategory = {
                requestBody: CategoryCreate
                
            }
export type TDataReadCategory = {
                id: number
                
            }
export type TDataUpdateCategory = {
                id: number
requestBody: CategoryUpdate
                
            }
export type TDataDeleteCategory = {
                id: number
                
            }

export class CategoriesService {

	/**
	 * Read Categories
	 * Retrieve categories.
	 * @returns CategoriesPublic Successful Response
	 * @throws ApiError
	 */
	public static readCategories(data: TDataReadCategories = {}): CancelablePromise<CategoriesPublic> {
		const {
limit = 100,
skip = 0,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/categories/',
			query: {
				skip, limit
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Create Category
	 * Create new category.
	 * @returns CategoryPublic Successful Response
	 * @throws ApiError
	 */
	public static createCategory(data: TDataCreateCategory): CancelablePromise<CategoryPublic> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/categories/',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Read Category
	 * Get category by ID.
	 * @returns CategoryPublic Successful Response
	 * @throws ApiError
	 */
	public static readCategory(data: TDataReadCategory): CancelablePromise<CategoryPublic> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/categories/{id}',
			path: {
				id
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Update Category
	 * Update a category.
	 * @returns CategoryPublic Successful Response
	 * @throws ApiError
	 */
	public static updateCategory(data: TDataUpdateCategory): CancelablePromise<CategoryPublic> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/v1/categories/{id}',
			path: {
				id
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Delete Category
	 * Delete a category.
	 * @returns app__models__Message Successful Response
	 * @throws ApiError
	 */
	public static deleteCategory(data: TDataDeleteCategory): CancelablePromise<app__models__Message> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/categories/{id}',
			path: {
				id
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

}

export type TDataReadImages = {
                limit?: number
skip?: number
                
            }
export type TDataCreateImage = {
                requestBody: ImageCreate
                
            }
export type TDataReadImage = {
                id: number
                
            }
export type TDataUpdateImage = {
                id: number
requestBody: ImageUpdate
                
            }
export type TDataDeleteImage = {
                id: number
                
            }

export class ImagesService {

	/**
	 * Read Images
	 * Retrieve images.
	 * @returns ImagesPublic Successful Response
	 * @throws ApiError
	 */
	public static readImages(data: TDataReadImages = {}): CancelablePromise<ImagesPublic> {
		const {
limit = 100,
skip = 0,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/images/',
			query: {
				skip, limit
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Create Image
	 * Create new image.
	 * @returns ImagePublic Successful Response
	 * @throws ApiError
	 */
	public static createImage(data: TDataCreateImage): CancelablePromise<ImagePublic> {
		const {
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/images/',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Read Image
	 * Get image by ID.
	 * @returns ImagePublic Successful Response
	 * @throws ApiError
	 */
	public static readImage(data: TDataReadImage): CancelablePromise<ImagePublic> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/images/{id}',
			path: {
				id
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Update Image
	 * Update an image.
	 * @returns ImagePublic Successful Response
	 * @throws ApiError
	 */
	public static updateImage(data: TDataUpdateImage): CancelablePromise<ImagePublic> {
		const {
id,
requestBody,
} = data;
		return __request(OpenAPI, {
			method: 'PUT',
			url: '/api/v1/images/{id}',
			path: {
				id
			},
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Delete Image
	 * Delete an image.
	 * @returns app__models__Message Successful Response
	 * @throws ApiError
	 */
	public static deleteImage(data: TDataDeleteImage): CancelablePromise<app__models__Message> {
		const {
id,
} = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/images/{id}',
			path: {
				id
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

}