"""A removable, explicitly fictional account for product demonstrations.

Run with ``python -m app.demo_data seed|refresh|status|clear`` after migrations.
"""

import argparse
import json
import os
import secrets
from datetime import datetime, timedelta
from pathlib import Path

from sqlmodel import Session, func, select

from app.api.routes.users import _delete_account_data
from app.core.db import engine
from app.core.security import get_password_hash
from app.models import (
    ChatMessage,
    ChatMessageSender,
    Constellation,
    ConstellationLink,
    ConstellationMemory,
    Conversation,
    ConversationStatus,
    MemoryDay,
    MemoryXP,
    PublishedConstellation,
    PublishedLink,
    PublishedMemory,
    StoryRelationship,
    StorySummary,
    User,
)

DEMO_EMAIL = "evelyn.demo@memriplace.test"
DEMO_NAME = "Evelyn Carter [Demo]"
CREDENTIALS_PATH = Path(__file__).resolve().parents[1] / ".demo-credentials.local.json"

# Fictional stories with the same summary / transcript split as real memories.
# The varied lengths are intentional: the demo should expose real reading and
# layout constraints rather than make every story fit neatly into a small card.
def prose(*paragraphs: str) -> str:
    return "\n\n".join(paragraphs)


MEMORIES = [
    (
        "Grandma's Sunday kitchen",
        prose(
            "On Sundays we went to Grandma Ruth's house without calling first. Her kitchen was painted a yellow that looked pale in the morning and almost golden by lunchtime. The room was too narrow for all of us to sit comfortably, so the children took turns at the table while the adults leaned against the counter. The kettle clicked off and on all morning. Grandma made cinnamon toast in the oven, and I used to watch through the glass for the sugar to bubble at the edges.",
            "She always set out one more plate than we needed. Sometimes a cousin arrived late; sometimes Mrs. Alvarez from next door came in carrying a newspaper or a handful of parsley. When I asked why she bothered if nobody had promised to come, Grandma said it was easier to put a plate away than to make someone feel unexpected. She would say it while moving the butter dish and finding another chair, as though there were nothing especially generous about it.",
            "I remember the sound of spoons against mugs and the way everyone kept talking across one another. I was too young then to see how much work went into making those mornings feel effortless. Now, when I have people over, I find myself checking whether there is a spare place at the table. It is a small habit, but it is one of the clearest ways I know that her kitchen still lives in me.",
        ),
        "What is a place from childhood that still feels close to you?",
        "My grandmother Ruth's kitchen. We visited on Sundays, usually without calling, and somehow everyone found a way into that tiny yellow room. The children took turns sitting at the table while the adults stood along the counter. I can still picture the oven door and the cinnamon toast bubbling inside it.",
        "What do you remember most vividly about being there?",
        "The kettle kept clicking off and on, and Grandma always put out an extra plate even when nobody else was expected. Sometimes our neighbor Mrs. Alvarez appeared with a newspaper or parsley from her garden. Grandma said it was easier to put a plate away than to make someone feel unexpected. I think about that every time I invite people into my own home.",
    ),
    (
        "The garden gate",
        prose(
            "The gate to Grandma Ruth's back garden had a rusty hinge that announced us before we reached the house. She always said she could tell which grandchild was coming by the way the gate opened: my brother pushed it fast, while I eased it back and tried to stop the squeak. It never worked. Beyond it, tomato vines leaned over their stakes, marigolds bordered the path, and a chipped blue watering can sat beside the steps.",
            "One summer she gave me a short row of beans to tend myself. I wanted them to grow by the end of the first week, and I was annoyed when all I could see was dirt. Grandma showed me how to test the soil with a finger instead of watering by guesswork. Each visit we pulled a few weeds, checked for new shoots, and tied up whatever had begun to climb. She did not make a grand lesson of it. She just expected me to return and pay attention.",
            "By August I could reach through the leaves and feel the pods before I saw them. We carried the first handful inside in the fold of my shirt, and she cooked them with supper. I remember feeling proud, but what stays with me more is the rhythm of going back. That garden taught me a kind of patience I did not have then: care was less about one impressive effort than about showing up again tomorrow.",
        ),
        "Was there an outdoor place that mattered to your family?",
        "Grandma's back garden. The gate had a rusty hinge, so she could hear us coming before we knocked. My brother would push it open in one sweep, but I tried to be quiet and never managed it. I remember the tomatoes, the marigolds around the path, and her chipped blue watering can.",
        "What did she teach you there?",
        "She let me look after a row of beans. At first I wanted them to grow immediately, but she showed me how to check the soil, pull weeds, and come back each visit. We carried the first beans inside in my shirt. I did not understand it as a lesson at the time, but it is where I learned that caring for something usually means returning to it.",
    ),
    (
        "An extra chair at the table",
        prose(
            "Mrs. Alvarez moved into the house next to Grandma Ruth's at the end of a hot July. Her family lived several states away, and she had not yet learned anybody's name on the street. I remember seeing her through Grandma's kitchen window, carrying grocery bags from the bus stop. Grandma went to the door before Mrs. Alvarez could reach her own steps and invited her to supper. She said it so plainly that there was no awkward moment in which our neighbor had to explain whether she was lonely.",
            "There were already too many of us around the table. Grandma fetched the old folding chair from behind the pantry door, and I helped clear a space for it beside mine. Mrs. Alvarez arrived with a bowl of sliced peaches, although nobody had asked her to bring anything. At first she spoke softly. By dessert she and Grandma were comparing biscuit recipes, disagreeing about how much salt belonged in the dough, and laughing at themselves. I remember being surprised by how quickly the room changed once she had a place in it.",
            "For weeks afterward Mrs. Alvarez came by with small offerings from her garden or stopped for tea. I cannot know exactly what that first invitation meant to her. What I saw was how Grandma made room before friendship had a name. When I think about hospitality now, I do not picture a perfect meal. I picture the scrape of that folding chair across the kitchen floor.",
        ),
        "Do you remember someone your family welcomed?",
        "Mrs. Alvarez had just moved in next door to Grandma Ruth. Her family was far away, and she barely knew anybody nearby. Grandma saw her carrying groceries home from the bus stop one July evening and invited her to supper before she could even get to her front door.",
        "What stayed with you about that evening?",
        "We were already crowded, but Grandma pulled the folding chair out from behind the pantry and made a space beside me. Mrs. Alvarez brought sliced peaches. By dessert she and Grandma were laughing over their different biscuit recipes. I remember the scrape of the chair on the floor more than the meal itself. That small sound is what making room for someone looks like to me.",
    ),
    (
        "The recipe card in her handwriting",
        prose(
            "Several years after Grandma Ruth died, I opened one of her cookbooks and found a recipe card tucked between two pages. It was written in pencil on the back of an old calendar square. The corners had gone soft, and there was a pale butter stain beside the ingredients. I knew the handwriting before I read a word: she made her capital letters too large and crossed her t's with quick, slanting lines.",
            "The recipe was for the biscuits she put on the table when everyone came over on Sundays. It asked for a handful of flour after the measured flour, which was not especially helpful. At the bottom she had written, 'Keep the dough soft and the table crowded.' The first time I tried to make them, I worked the dough too long. They came out heavy. On the second try I remembered how she used to stop mixing as soon as it came together, flour her hands, and pat each biscuit into shape without making a fuss.",
            "I still use the card, though I have written the approximate amounts on a separate piece of paper so it will not wear out. When the biscuits are in the oven, the kitchen smells briefly like hers. It does not erase the years since we lost her. It gives me one ordinary way to bring her into a room where the people I love are gathered, and that feels truer to her than keeping the card hidden away.",
        ),
        "Is there a small object that brings someone back to you?",
        "A biscuit recipe card I found in Grandma Ruth's cookbook years after she died. It is written in pencil on the back of an old calendar square, with worn corners and a butter stain. I recognized her oversized capital letters immediately. I had been looking for a different recipe and did not expect to find her handwriting that day.",
        "What does it mean to you now?",
        "The measurements are vague, so my first batch was heavy. Then I remembered the way she handled the dough and tried again. Her note says, 'Keep the dough soft and the table crowded.' I use a copy for the quantities and keep the original safe. Baking them for people brings her back to me more clearly than leaving the card in a drawer.",
    ),
    (
        "The long drive to the coast",
        prose(
            "Every August, Dad loaded our old car before sunrise for the drive to the coast. He packed the towels the night before and woke us while the house was still dark. My brother and I carried pillows into the back seat, certain we would sleep again, but we always stayed awake to watch the first light reach the fields. Dad chose the slower road because he liked the view and because it passed a roadside stand that sold peaches in brown paper bags.",
            "The car radio lost its signal in the low stretches. Dad would tap the dial and wait for a song we all knew to come through. We sang badly, argued about the words, and let the warm air rush in through the open windows. At the peach stand, my brother and I each chose one that was almost too ripe. We ate them over the paper bag so the juice would not drip on the seats. By the time the air began to smell faintly of salt, we were already sticky and tired and happy.",
            "I remember the beach, but it is the drive I return to most often. Dad was usually busy and conscious of the clock. On those days he seemed willing to take the wrong turn, make an extra stop, or sit with us a few minutes longer before getting out of the car. The coast gave the trip a destination. What made it memorable was the rare feeling that none of us had to be anywhere else.",
        ),
        "Tell me about a trip you remember from when you were young.",
        "Every August Dad took us to the coast in his old car. He woke us before sunrise, and my brother and I carried pillows into the back seat. We always meant to go back to sleep but ended up watching the light come over the fields. Dad chose the slow road because it went past a peach stand.",
        "What made that journey special?",
        "The radio went in and out, and Dad would fiddle with it until he found a song we knew. We sang with the windows down and ate peaches over a paper bag to keep the seats clean. Dad was usually busy, but on that drive he did not seem to watch the clock. I remember that feeling more clearly than anything we did once we reached the beach.",
    ),
    (
        "Our first apartment",
        prose(
            "The first apartment my partner and I rented was on the third floor of a brick building with a narrow staircase. We carried boxes up one at a time and discovered that the living room echoed when we spoke. Our chairs were borrowed, our lamp leaned slightly to one side, and we had to keep the kitchen window open because the radiator made the room too warm. We told each other it was temporary, but I remember taking care with where we set each small thing down.",
            "For the first few weeks we ate dinner on the floor because the table had not arrived. We spread a towel under the plates and watched the lights come on in the apartments across the street. We made plans for shelves, plants, and a proper sofa, then worked out which of those we could actually afford. Some evenings the uncertainty of rent and new jobs made us quiet. Other evenings the almost-empty rooms felt like space we were free to shape together.",
            "I used to think a home would announce itself once we owned enough furniture. Instead, it began with repeated small acts: keeping a mug on the same windowsill, leaving a light on for the other person, learning which step creaked at night. Looking back, I can still feel the nerves of that first month. I also remember the pride of locking the door behind us and knowing that, however unfinished it looked, we were making a place of our own.",
        ),
        "What was your first home of your own like?",
        "My partner and I rented a third-floor apartment in a brick building. The living room echoed, the kitchen radiator made everything too warm, and most of our furniture was borrowed. We ate dinner on the floor for weeks because we had no table. I remember how carefully we placed each box, as though that might make the rooms feel finished.",
        "How did it feel to be there?",
        "Exciting and frightening in almost equal measure. We watched the city lights from the window and talked about everything we wanted to buy, then calculated what rent left us. Gradually the apartment started to feel like ours because of little routines, not because we acquired furniture. Even when it was nearly empty, I felt proud each time we came home together.",
    ),
    (
        "A song through the static",
        prose(
            "There was a stretch of road on our summer trips to the coast where the car radio turned mostly to static. Dad never switched it off. He kept one hand on the wheel and used the other to nudge the dial, convinced our favorite song would come back if he was patient. My brother called it a lost cause. Then, just as the road curved toward the water, the first few notes would emerge and Dad would grin as if he had arranged the timing himself.",
            "None of us sang particularly well. My brother invented words when he forgot them, I insisted on the real ones, and Dad came in a beat early on the chorus. The windows were open and the wind swallowed half of what we sang. I can still picture the paper bag from the peach stand between our feet and Dad's elbow resting on the open window. It was a noisy car, but for those few minutes it felt like we were all keeping the same time.",
            "Years later I heard the song in a grocery store and stopped in the middle of an aisle. What came back was not just the tune. It was the feel of the seat, the wind, the argument about the lyrics, and the certainty that the sea was close. I do not need to recreate the trip for the memory to matter. Sometimes the opening notes are enough to bring all of us into that car again.",
        ),
        "Is there a sound that takes you back to a particular time?",
        "A song Dad used to find on the car radio when we drove to the coast. There was one stretch where the signal faded, but he kept turning the dial until it came back. My brother called it hopeless, and then the opening notes would appear around the bend toward the sea.",
        "What happens when you hear it today?",
        "I hear my brother making up words, Dad entering the chorus too early, and the wind drowning us all out. The paper bag from the peach stand would be between our feet. I heard the song unexpectedly in a grocery store years later and stopped walking. It brought back the whole car, not just the music.",
    ),
    (
        "The fairground at dusk",
        prose(
            "We went to the county fair near the end of one summer, when the evenings were starting to cool. Dad entered a pie on a dare from his sister and came away with a little blue ribbon. He pretended to be embarrassed, but he pinned it to his jacket for the rest of the night. My brother and I spent too long deciding which ride to take first while music from different booths drifted over the path.",
            "At dusk we got onto the Ferris wheel. I was nervous when it stopped near the top to let other people board. Dad pointed out the row of houses beyond the fairground and the first lights turning on along the road. From that height the booths looked like a small city made just for us, and the music was softer. By the time our car moved again, I wanted to stay up there long enough to watch the whole sky change color.",
            "I tucked the paper ticket into my coat pocket and found it there repeatedly through autumn. It grew creased and nearly unreadable, but I kept returning it to the same place. The ticket was not valuable; it simply marked a day when Dad was playful, my brother was beside me, and summer lasted a little longer than I expected. I still think of that view whenever I pass a fairground after dark.",
        ),
        "What is a celebration you still remember clearly?",
        "The county fair at the end of one summer. Dad entered a pie on a dare and won a small blue ribbon, which he wore on his jacket even while pretending it was embarrassing. We stayed late enough for the lights to come on, and my brother and I finally chose the Ferris wheel.",
        "What detail do you hold onto?",
        "The wheel stopped near the top while other people boarded. Dad pointed out the houses beyond the fairground, and I watched the road lights appear one by one. I kept my paper ticket in my coat pocket for months afterward. It reminded me of that view and of how playful Dad was that night.",
    ),
]

GROUPS = [
    {
        "title": "The house that welcomed everyone",
        "overview": prose(
            "When I think of Grandma Ruth's house, I do not picture its size first. I picture the movement between the yellow kitchen and the back garden: someone easing open the squeaky gate, the kettle starting again, a plate appearing on the table before we knew who might need it. On Sundays our family crowded into the kitchen for cinnamon toast. The children took turns sitting down, adults found places along the counter, and Grandma kept one extra plate ready. She made a full room feel open rather than crowded. Only as I grew older did I begin to notice how much attention that required.",
            "The garden showed me another side of the same care. Grandma trusted me with a row of beans and taught me to check the soil, pull weeds, and return, even when nothing seemed to be happening. The first handful we carried inside did not grow because of one exciting afternoon. It grew because we kept coming back. Later, when Mrs. Alvarez arrived in the neighborhood without family nearby, Grandma responded in much the same spirit. She brought out the old folding chair and made a place for her at supper. By dessert they were laughing over biscuit recipes. What I remember is that Grandma offered the chair before she knew whether a friendship would follow.",
            "Years after Grandma died, I found her biscuit recipe tucked into a cookbook. Her penciled instruction to keep the dough soft and the table crowded felt like a description of the life she had built. I still make the biscuits, imperfectly, when people come over. These memories belong together because they show that her welcome was more than a warm feeling. It was a practice made of small, repeated choices: tending a row of beans, listening for a gate, setting another plate, and making room for whoever arrived.",
        ),
        "stories": (0, 1, 2, 3),
        "positions": ((0.16, 0.36), (0.43, 0.14), (0.78, 0.33), (0.51, 0.76)),
        "links": ((0, 1), (0, 2), (0, 3), (1, 2)),
        "public": True,
    },
    {
        "title": "The roads that brought us home",
        "overview": prose(
            "Every August Dad took the slow road to the coast. My brother and I climbed into the car before sunrise with pillows we never really used, and we watched the fields brighten through the windows. We stopped at the same roadside stand for peaches and ate them carefully over a paper bag. When the radio dissolved into static, Dad kept searching until the song we loved came through. We sang loudly, with wrong words and bad timing. I remember the beach, but the hours in the car are what have stayed with me: Dad setting aside his usual hurry and letting the day take as long as it took.",
            "The song still has that power. Hearing its opening notes years later in a grocery store brought back the wind through the car windows, my brother's invented lyrics, and the sense that the sea was just around the bend. I felt something similar at the county fair one late summer evening. Dad wore the blue ribbon he had won for a pie, and from the Ferris wheel I watched the lights come on below us. I carried the paper ticket in my coat pocket for months. Neither the song nor the ticket could hold the whole day, but each was enough to open a door back into it.",
            "When my partner and I moved into our first apartment, I was learning a different version of the same lesson. We ate on the floor, borrowed chairs, worried about rent, and watched city lights from a nearly empty room. There was no familiar road or family car to make that place feel safe. We built that feeling through small routines and by returning to each other at the end of the day. Together, these memories remind me that home was never only one address. Sometimes it was the people singing beside me on the road; later it was the place two of us slowly learned to make our own.",
        ),
        "stories": (4, 5, 6, 7),
        "positions": ((0.19, 0.23), (0.76, 0.70), (0.70, 0.18), (0.28, 0.75)),
        "links": ((4, 6), (6, 7), (7, 5), (4, 5)),
        "public": True,
    },
    {
        "title": "The little things we carry",
        "overview": prose(
            "I have kept a few objects that would mean very little to anyone else. Grandma Ruth's biscuit recipe is written on the back of an old calendar square, with softened corners and a butter stain near the ingredients. I found it in her cookbook years after she died and recognized her handwriting before I read the words. The measurements are not precise, so I have learned to make the biscuits partly by remembering how she handled the dough. Her note about keeping the table crowded is the part I return to most. Baking them lets me bring something of her welcome into my own kitchen.",
            "Other keepsakes are harder to put in a drawer. A song Dad found through the static on our drives to the coast can still return me to the back seat beside my brother. I hear us singing off key with the windows down and remember the paper bag of peaches at our feet. A creased fairground ticket carries a different evening with Dad: his blue pie ribbon, the Ferris wheel paused near the top, and lights appearing on the road beyond the fair. I kept that ticket in my coat pocket well into autumn because I did not want the day to feel finished.",
            "The recipe card, the song, and the ticket do not tell complete stories by themselves. Each is a small way back to a person, a place, and a particular feeling that I might otherwise struggle to summon. They also ask something of me. A card matters more when I use the recipe; a song becomes fuller when I tell someone why I stopped to listen; the ticket reminds me to notice an ordinary evening while I am still living it. I keep these memories together for that reason. They show how a little object, or even a few familiar notes, can make the past feel present without pretending it has not changed.",
        ),
        "stories": (3, 6, 7),
        "positions": ((0.19, 0.50), (0.51, 0.19), (0.80, 0.56)),
        "links": ((3, 6), (6, 7)),
        "public": False,
    },
]


def _credentials(password: str | None, write_file: bool) -> tuple[str, bool]:
    if not write_file:
        if not password:
            raise ValueError("Set DEMO_PASSWORD when using --no-credentials-file")
        return password, False
    if CREDENTIALS_PATH.exists():
        data = json.loads(CREDENTIALS_PATH.read_text())
        if data.get("email") != DEMO_EMAIL or not isinstance(data.get("password"), str):
            raise ValueError(f"Unexpected credential file: {CREDENTIALS_PATH}")
        if password and password != data["password"]:
            raise ValueError("DEMO_PASSWORD does not match the existing local credential file")
        return data["password"], False
    password = password or secrets.token_urlsafe(24)
    fd = os.open(CREDENTIALS_PATH, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w") as handle:
        json.dump({"email": DEMO_EMAIL, "password": password}, handle, indent=2)
        handle.write("\n")
    return password, True


def seed(write_file: bool = True) -> None:
    with Session(engine) as session:
        existing = session.exec(select(User).where(User.email == DEMO_EMAIL)).first()
        if existing:
            if existing.full_name != DEMO_NAME or existing.is_superuser:
                raise ValueError("Demo email belongs to a different account; refusing to change it")
            print("Demo account already exists. No data or password was changed.")
            return

        password, created_file = _credentials(os.environ.get("DEMO_PASSWORD"), write_file)
        now = datetime.utcnow()
        try:
            user = User(email=DEMO_EMAIL, full_name=DEMO_NAME,
                        hashed_password=get_password_hash(password), is_active=True,
                        is_superuser=False)
            session.add(user)
            session.flush()
            stories = []
            for index, (title, summary, question1, answer1, question2, answer2) in enumerate(MEMORIES):
                timestamp = now - timedelta(days=len(MEMORIES) - index - 1)
                conversation = Conversation(
                    user_id=user.id, node_title=title, node_prompt=question1,
                    status=ConversationStatus.COMPLETE, user_turn_count=2,
                    ready_to_save=True, created_at=timestamp,
                )
                session.add(conversation)
                session.flush()
                for offset, (sender, content) in enumerate((
                    (ChatMessageSender.AI, question1), (ChatMessageSender.USER, answer1),
                    (ChatMessageSender.AI, question2), (ChatMessageSender.USER, answer2),
                )):
                    session.add(ChatMessage(
                        conversation_id=conversation.id, sender_id=user.id,
                        sender_type=sender, content=content,
                        timestamp=timestamp + timedelta(minutes=offset),
                    ))
                story = StorySummary(
                    conversation_id=conversation.id, user_id=user.id,
                    title=title, summary_text=summary, created_at=timestamp,
                    modified_at=timestamp,
                )
                session.add(story)
                session.flush()
                stories.append(story)
                session.add(MemoryXP(user_id=user.id, conversation_key=conversation.id,
                                     points=25, earned_at=timestamp))
                session.add(MemoryDay(user_id=user.id, activity_date=timestamp.date()))

            relationships = {}
            for number, group in enumerate(GROUPS):
                created_at = now - timedelta(days=2 - number)
                constellation = Constellation(
                    owner_id=user.id, title=group["title"], overview=group["overview"],
                    created_at=created_at, modified_at=created_at,
                )
                session.add(constellation)
                session.flush()
                for order, (story_index, (x, y)) in enumerate(zip(group["stories"], group["positions"], strict=True)):
                    session.add(ConstellationMemory(
                        constellation_id=constellation.id, story_id=stories[story_index].id,
                        display_order=order, x=x, y=y, share_story=group["public"],
                        share_image=False,
                    ))
                for a, b in group["links"]:
                    pair = tuple(sorted((a, b)))
                    if pair not in relationships:
                        relationship = StoryRelationship(
                            user_id=user.id, story_a_id=stories[pair[0]].id,
                            story_b_id=stories[pair[1]].id,
                        )
                        session.add(relationship)
                        session.flush()
                        relationships[pair] = relationship
                    session.add(ConstellationLink(
                        constellation_id=constellation.id,
                        relationship_id=relationships[pair].id,
                    ))
                if group["public"]:
                    publication = PublishedConstellation(
                        constellation_id=constellation.id, owner_id=user.id,
                        title=constellation.title, overview=constellation.overview,
                        author_name=DEMO_NAME, author_level=3,
                        published_at=created_at,
                    )
                    session.add(publication)
                    session.flush()
                    for order, (story_index, (x, y)) in enumerate(zip(group["stories"], group["positions"], strict=True)):
                        story = stories[story_index]
                        session.add(PublishedMemory(
                            publication_id=publication.id, source_story_id=story.id,
                            display_order=order, title=story.title,
                            story_text=story.summary_text, x=x, y=y,
                        ))
                    for a, b in group["links"]:
                        session.add(PublishedLink(
                            publication_id=publication.id,
                            story_a_id=stories[a].id, story_b_id=stories[b].id,
                        ))
            session.commit()
        except Exception:
            session.rollback()
            if created_file:
                CREDENTIALS_PATH.unlink(missing_ok=True)
            raise
    print("Seeded one fictional account, 8 memories, 3 constellations (2 public).")
    if write_file:
        print(f"Login credentials: {CREDENTIALS_PATH}")
    else:
        print("Login password is the DEMO_PASSWORD value supplied for this run.")


def refresh() -> None:
    """Replace only Evelyn's seeded story text, transcripts, and public snapshots.

    Existing IDs, relationships, publication state, and credentials stay intact.
    This is explicit because ``seed`` intentionally leaves an existing account alone.
    """
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == DEMO_EMAIL)).first()
        if not user or user.full_name != DEMO_NAME or user.is_superuser:
            raise ValueError("Seed the expected demo account before refreshing it")

        stories = session.exec(select(StorySummary).where(StorySummary.user_id == user.id)).all()
        stories_by_title = {story.title: story for story in stories}
        if len(stories_by_title) != len(stories) or any(title not in stories_by_title for title, *_ in MEMORIES):
            raise ValueError("Demo memories no longer match the seed; refusing to overwrite them")

        constellations = session.exec(select(Constellation).where(Constellation.owner_id == user.id)).all()
        groups_by_title = {group.title: group for group in constellations}
        if len(groups_by_title) != len(constellations) or any(group["title"] not in groups_by_title for group in GROUPS):
            raise ValueError("Demo constellations no longer match the seed; refusing to overwrite them")

        now = datetime.utcnow()
        for title, summary, question1, answer1, question2, answer2 in MEMORIES:
            story = stories_by_title[title]
            messages = session.exec(
                select(ChatMessage)
                .where(ChatMessage.conversation_id == story.conversation_id)
                .order_by(ChatMessage.timestamp, ChatMessage.id)
            ).all()
            senders = [ChatMessageSender.AI, ChatMessageSender.USER,
                       ChatMessageSender.AI, ChatMessageSender.USER]
            if [message.sender_type for message in messages] != senders:
                raise ValueError(f"Transcript for {title!r} was edited; refusing to overwrite it")
            for message, content in zip(messages, (question1, answer1, question2, answer2), strict=True):
                message.content = content
            story.summary_text = summary
            story.modified_at = now

        for group_data in GROUPS:
            constellation = groups_by_title[group_data["title"]]
            constellation.overview = group_data["overview"]
            constellation.modified_at = now
            publication = session.exec(
                select(PublishedConstellation)
                .where(PublishedConstellation.constellation_id == constellation.id)
            ).first()
            if publication:
                publication.overview = constellation.overview
                published_memories = session.exec(
                    select(PublishedMemory)
                    .where(PublishedMemory.publication_id == publication.id)
                ).all()
                for published_memory in published_memories:
                    story = next((story for story in stories if story.id == published_memory.source_story_id), None)
                    if story:
                        published_memory.story_text = story.summary_text

        session.commit()
    print("Refreshed Evelyn's 8 memory narratives, 3 constellation overviews, and existing public snapshots.")


def status() -> None:
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == DEMO_EMAIL)).first()
        if not user:
            print("Demo account not present.")
            return
        stories = session.exec(select(func.count(StorySummary.id)).where(StorySummary.user_id == user.id)).one()
        groups = session.exec(select(func.count(Constellation.id)).where(Constellation.owner_id == user.id)).one()
        public = session.exec(select(func.count(PublishedConstellation.id)).where(PublishedConstellation.owner_id == user.id)).one()
        print(f"{DEMO_EMAIL}: {stories} memories, {groups} constellations, {public} public")


def clear(confirm_email: str) -> None:
    if confirm_email != DEMO_EMAIL:
        raise ValueError(f"Pass --confirm-email {DEMO_EMAIL} to remove only the demo account")
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == DEMO_EMAIL)).first()
        if user:
            if user.full_name != DEMO_NAME or user.is_superuser:
                raise ValueError("Demo email belongs to a different account; refusing to delete it")
            _delete_account_data(session, user.id)
    CREDENTIALS_PATH.unlink(missing_ok=True)
    print("Demo account, its private data, and its public snapshots removed.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    subcommands = parser.add_subparsers(dest="command", required=True)
    seed_parser = subcommands.add_parser("seed", help="Create the demo account once")
    seed_parser.add_argument("--no-credentials-file", action="store_true",
                             help="Use DEMO_PASSWORD from the environment; useful on Render")
    subcommands.add_parser("refresh", help="Update text on the existing demo account without changing IDs or login")
    subcommands.add_parser("status", help="Count only demo-owned records")
    clear_parser = subcommands.add_parser("clear", help="Delete only the demo account and its records")
    clear_parser.add_argument("--confirm-email", required=True)
    args = parser.parse_args()
    if args.command == "seed":
        seed(write_file=not args.no_credentials_file)
    elif args.command == "refresh":
        refresh()
    elif args.command == "status":
        status()
    else:
        clear(args.confirm_email)


if __name__ == "__main__":
    main()
