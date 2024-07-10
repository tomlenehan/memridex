import logging
from sqlmodel import Session, select
from app.core.db import engine, init_db
from app.models import StockStoryPrompt, Category

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init(session: Session) -> None:
    # Initialize the database schema
    init_db(session)

    # Check if categories already exist
    existing_categories = session.exec(select(Category)).all()
    if not existing_categories:
        # Adding categories
        categories = [
            {"name": "Childhood", "description": "Memories from early years, including family, friends, and school experiences."},
            {"name": "Career", "description": "Professional life, achievements, and lessons learned at work."},
            {"name": "Challenges", "description": "Difficult times faced and how they were overcome."},
            {"name": "Family", "description": "Family traditions, relationships, and important family events."},
            {"name": "Influences", "description": "People who had a significant impact on their life."},
            {"name": "Travel", "description": "Memorable travel experiences and adventures."},
            {"name": "Hobbies", "description": "Pastimes, activities, and interests pursued over the years."},
            {"name": "Historical Events", "description": "Significant historical events witnessed and their impact."},
            {"name": "Decisions", "description": "Important decisions made and their outcomes."},
            {"name": "Friendship", "description": "Stories of friendships and shared experiences."},
            {"name": "Cultural Experiences", "description": "Influential books, movies, music, and art."},
            {"name": "Food", "description": "Memorable meals and culinary experiences."},
            {"name": "Pets", "description": "Stories about pets and their significance."},
            {"name": "Achievements", "description": "Accomplishments and moments of pride."},
            {"name": "Special Places", "description": "Places that hold special memories."},
            {"name": "Life Lessons", "description": "Valuable lessons learned through experiences."},
            {"name": "Acts of Kindness", "description": "Times they helped others or received help."},
            {"name": "Seasons", "description": "Favorite seasons and related activities."},
            {"name": "Celebrations", "description": "Memorable celebrations and events."},
            {"name": "Health and Wellness", "description": "Experiences related to health and personal well-being."}
        ]

        category_objs = {}
        for category_data in categories:
            category = Category(**category_data)
            session.add(category)
            session.commit()
            category_objs[category_data['name']] = category

        # Check if stock story prompts already exist
        existing_prompts = session.exec(select(StockStoryPrompt)).all()
        if not existing_prompts:
            # Adding stock story prompts
            prompts = [
                {"prompt": "Describe a memorable holiday celebration from your childhood. What made it special?", "category_id": category_objs["Childhood"].id, "image_url": "https://memribox-defaults.s3.amazonaws.com/memorable_holiday.png"},
                {"prompt": "Tell us about your first job. What did you do, and how did it shape your career?", "category_id": category_objs["Career"].id, "image_url": "https://memribox-defaults.s3.amazonaws.com/first_job.png"},
                {"prompt": "Share a story about a challenging time you faced and how you overcame it.", "category_id": category_objs["Challenges"].id, "image_url": "https://memribox-defaults.s3.amazonaws.com/challenging_time.png"},
                {"prompt": "Describe a favorite family tradition and what it means to you.", "category_id": category_objs["Family"].id, "image_url": "https://memribox-defaults.s3.amazonaws.com/family_tradition.png"},
                {"prompt": "Tell us about a person who had a significant impact on your life.", "category_id": category_objs["Influences"].id, "image_url": "https://memribox-defaults.s3.amazonaws.com/impact_person.png"},
                {"prompt": "Share a memorable travel experience. Where did you go and what did you do?", "category_id": category_objs["Travel"].id, "image_url": "https://memribox-defaults.s3.amazonaws.com/memorable_travel.png"},
                {"prompt": "Describe a hobby or activity you enjoyed when you were younger. How did you get involved?", "category_id": category_objs["Hobbies"].id, "image_url": "https://memribox-defaults.s3.amazonaws.com/young_hobby.png"},
                {"prompt": "Tell us about a significant historical event you witnessed. How did it affect you?", "category_id": category_objs["Historical Events"].id, "image_url": "https://memribox-defaults.s3.amazonaws.com/historical_event.png"},
                {"prompt": "Describe a time when you had to make a tough decision. What did you choose and why?", "category_id": category_objs["Decisions"].id, "image_url": "https://memribox-defaults.s3.amazonaws.com/tough_decision.png"},
                {"prompt": "Share a story about a special friend and the adventures you had together.", "category_id": category_objs["Friendship"].id, "image_url": "https://memribox-defaults.s3.amazonaws.com/adventure_friend.png"},
                {"prompt": "Tell us about a book or movie that had a profound impact on you. Why was it important?", "category_id": category_objs["Cultural Experiences"].id, "image_url": "https://memribox-defaults.s3.amazonaws.com/book_or_movie.png"},
                {"prompt": "Describe a memorable meal you had. What was the occasion and who were you with?", "category_id": category_objs["Food"].id, "image_url": "https://memribox-defaults.s3.amazonaws.com/memorable_meal.png"},
                {"prompt": "Share a story about a pet you had. What made them special?", "category_id": category_objs["Pets"].id, "image_url": "https://memribox-defaults.s3.amazonaws.com/special_pet.png"},
                {"prompt": "Tell us about a time when you felt truly proud of an accomplishment.", "category_id": category_objs["Achievements"].id, "image_url": "https://memribox-defaults.s3.amazonaws.com/proud_accomplishment.png"},
                {"prompt": "Describe a place that holds a special memory for you. What happened there?", "category_id": category_objs["Special Places"].id, "image_url": "https://memribox-defaults.s3.amazonaws.com/special_place.png"},
                {"prompt": "Share a story about a lesson you learned the hard way. How did it change you?", "category_id": category_objs["Life Lessons"].id, "image_url": "https://memribox-defaults.s3.amazonaws.com/hard_lesson.png"},
                {"prompt": "Tell us about a time you helped someone in need. What did you do and how did it feel?", "category_id": category_objs["Acts of Kindness"].id, "image_url": "https://memribox-defaults.s3.amazonaws.com/person_in_need.png"},
                {"prompt": "Describe a favorite season of the year and the activities you enjoyed during it.", "category_id": category_objs["Seasons"].id, "image_url": "https://memribox-defaults.s3.amazonaws.com/favorite_season.png"},
                {"prompt": "Share a story about a memorable birthday celebration. What made it unforgettable?", "category_id": category_objs["Celebrations"].id, "image_url": "https://memribox-defaults.s3.amazonaws.com/memorable_birthday.png"},
                {"prompt": "Tell us about a musical experience that left a lasting impression on you.", "category_id": category_objs["Health and Wellness"].id, "image_url": "https://memribox-defaults.s3.amazonaws.com/music_experience.png"}
            ]

            for prompt_data in prompts:
                prompt = StockStoryPrompt(**prompt_data)
                session.add(prompt)

            session.commit()


def main() -> None:
    logger.info("Creating initial data")
    with Session(engine) as session:
        init(session)
    logger.info("Initial data created")


if __name__ == "__main__":
    main()
