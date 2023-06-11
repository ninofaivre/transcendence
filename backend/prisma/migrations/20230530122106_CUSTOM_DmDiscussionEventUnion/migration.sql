ALTER TABLE "DmDiscussionEvent"
  ADD CONSTRAINT event_union
  CHECK (("classicDmDiscussionEventId" IS NULL)
	<> ("chanInvitationDmDiscussionEventId" IS NULL));
