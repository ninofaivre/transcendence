------------------CHAN------------------

--- event | message ---
ALTER TABLE "ChanDiscussionElement"
  ADD CONSTRAINT message_event_union
  CHECK(COALESCE("eventId" , "messageId") IS NOT NULL);
--- event | message ---

--- classicEvent | changedTitleEvent | deletedMessageEvent ---
ALTER TABLE "ChanDiscussionEvent"
  ADD CONSTRAINT event_union
  CHECK (("classicChanDiscussionEventId" IS NOT NULL)::int +
	("changedTitleChanDiscussionEventId" IS NOT NULL)::int +
	("deletedMessageChanDiscussionEventId" IS NOT NULL)::int
		= 1);
--- classicEvent | changedTitleEvent | deletedMessageEvent ---

--- type: 'PUBLIC' && title !== null || type: 'PRIVATE' ---
ALTER TABLE "Chan"
    ADD CONSTRAINT "ChanType_Title"
    CHECK(("type" = "PRIVATE") OR ("title" IS NOT NULL AND "type" = "PUBLIC"))

------------------CHAN------------------

-------------------DM-------------------

--- event | message ---
ALTER TABLE "DmDiscussionElement"
  ADD CONSTRAINT message_event_union
  CHECK(COALESCE("eventId" , "messageId") IS NOT NULL);
--- event | message ---

--- classicEvent | chanInvitationEvent | deletedMessageEvent | blockedEvent ---
ALTER TABLE "DmDiscussionEvent"
  ADD CONSTRAINT event_union
  CHECK (("classicDmDiscussionEventId" IS NOT NULL)::int +
    ("chanInvitationDmDiscussionEventId" IS NOT NULL)::int +
    ("deletedMessageDmDiscussionEventId" IS NOT NULL)::int +
    ("blockedDmDiscussionEventId" IS NOT NULL)::int
        = 1);
--- classicEvent | chanInvitationEvent | deletedMessageEvent | blockedEvent ---

-------------------DM-------------------
