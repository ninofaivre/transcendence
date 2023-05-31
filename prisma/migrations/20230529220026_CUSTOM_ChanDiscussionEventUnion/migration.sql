ALTER TABLE "ChanDiscussionEvent"
  ADD CONSTRAINT event_union
  CHECK (("classicChanDiscussionEventId" IS NULL)
	<> ("changedTitleChanDiscussionEventId" IS NULL));
