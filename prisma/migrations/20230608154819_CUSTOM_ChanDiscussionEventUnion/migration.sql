ALTER TABLE "ChanDiscussionEvent"
  ADD CONSTRAINT event_union
  CHECK (("classicChanDiscussionEventId" IS NOT NULL)::int +
	("changedTitleChanDiscussionEventId" IS NOT NULL)::int +
	("deletedMessageChanDiscussionEventId" IS NOT NULL)::int
		= 1);
