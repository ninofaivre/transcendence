ALTER TABLE "DmDiscussionElement"
  ADD CONSTRAINT message_event_union
  CHECK (("eventId" IS NULL)
	<> ("messageId" IS NULL));
