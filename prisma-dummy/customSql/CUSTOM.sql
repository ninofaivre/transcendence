------------------USER------------------

alter table "User" drop constraint if exists "UserName";
alter table "User" add constraint "UserName"
    check("name" != '@me');--'
--- name !== "@me" ---

------------------USER------------------

------------------CHAN------------------

--- event | message ---
alter table "ChanDiscussionElement" drop constraint if exists "message_event_union";
alter table "ChanDiscussionElement" add constraint "message_event_union"
  CHECK(COALESCE("eventId", "messageId") IS NOT NULL);
--- event | message ---

--- classicEvent | changedTitleEvent | deletedMessageEvent ---
alter table "ChanDiscussionEvent" drop constraint if exists "event_union";
alter table "ChanDiscussionEvent" add constraint "event_union"
  CHECK (("classicChanDiscussionEventId" IS NOT NULL)::int +
	("changedTitleChanDiscussionEventId" IS NOT NULL)::int +
	("deletedMessageChanDiscussionEventId" IS NOT NULL)::int +
	("mutedUserChanDiscussionEventId" IS NOT NULL)::int
		= 1);
--- classicEvent | changedTitleEvent | deletedMessageEvent ---

--- type: 'PUBLIC' && title !== null || type: 'PRIVATE' ---
alter table "Chan" drop constraint if exists "ChanType_Title";
alter table "Chan" add constraint "ChanType_Title"
    CHECK(("type" = 'PRIVATE' AND "password" IS NULL)
        OR ("title" IS NOT NULL AND "type" = 'PUBLIC'));
--- type: 'PUBLIC' && title !== null || type: 'PRIVATE' ---

--- title !== "@me" ---
alter table "Chan" drop constraint if exists "ChanTitle";
alter table "Chan" add constraint "ChanTitle"
    CHECK("title" != '@me');
--- title !== "@me" ---

-- TODO if eventType end with _CONCERNED concernedUser not null else null
-- alter table "ChanDiscussionEvent" drop constraint if exists "eventType";
-- alter table "ChanDiscussionEvent" add constraint "eventType"
--     CHECK(
--         ("classicChanDiscussionEventId" is null) or
--         ("classicChanDiscussionEvent.eventType"::text like '%_CONCERNED' and concernedUser is not null) or
--         concernedUser is null
--     );

------------------CHAN------------------

-------------------DM-------------------

--- event | message ---
alter table "DmDiscussionElement" drop constraint if exists "message_event_union";
alter table "DmDiscussionElement" add constraint "message_event_union"
  CHECK(COALESCE("eventId", "messageId") IS NOT NULL);
--- event | message ---

--- classicEvent | chanInvitationEvent | deletedMessageEvent | blockedEvent ---
alter table "DmDiscussionEvent" drop constraint if exists "event_union";
ALTER TABLE "DmDiscussionEvent"
  ADD CONSTRAINT event_union
  CHECK (("classicDmDiscussionEventId" IS NOT NULL)::int +
    ("chanInvitationDmDiscussionEventId" IS NOT NULL)::int +
    ("deletedMessageDmDiscussionEventId" IS NOT NULL)::int +
    ("blockedDmDiscussionEventId" IS NOT NULL)::int
        = 1);
--- classicEvent | chanInvitationEvent | deletedMessageEvent | blockedEvent ---

-------------------DM-------------------
