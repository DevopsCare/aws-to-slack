//
// AWS GuardDuty event parser
//
exports.matches = event =>
		_.has(event.message, "InsightId");

exports.parse = event => {
	const message = event.message;

	const id = _.get(message, "InsightId");
	const url = _.get(message, "InsightUrl");
	const description = _.get(message, "InsightDescription");
	const createdAt = new Date(_.get(message, "StartTime"));
	const severity = _.get(message, "InsightSeverity");
	const accountId = _.get(message, "AccountId");
	const region = _.get(message, "Region");
	const type = _.get(message, "MessageType");

	const fields = [];

	fields.push({
		title: "Severity",
		value: severity,
		short: true
	});

	let color = event.COLORS.neutral;
	if (severity === 'medium') {
		color = event.COLORS.warning;
	}
	if (severity === 'high') {
		color = event.COLORS.critical;
	}


	fields.push({
		title: "Type",
		value: type,
		short: true
	});

	if (type === "NEW_INSIGHT") {
		fields.push({
			title: "Account",
			value: accountId,
			short: true
		});

		fields.push({
			title: "Region",
			value: region,
			short: true
		});

		fields.push({
			title: "Url",
			value: url,
			short: false
		});

		return event.attachmentWithDefaults({
			author_name: "Amazon DevopsGuru",
			fallback: description,
			color: color,
			title: description,
			fields: fields,
			mrkdwn_in: ["title", "text"],
			ts: createdAt,
		})
	}
	if (type === "SEVERITY_UPGRADED") {
		return event.attachmentWithDefaults({
			author_name: "Amazon DevopsGuru",
			fallback: `Severity upgraded to ${severity}`,
			color: color,
			title: `Severity upgraded to ${severity}`,
			fields: fields,
			mrkdwn_in: ["title", "text"],
			ts: createdAt,
		})
	}

	if (type === "NEW_RECOMMENDATION"
			|| type === "NEW_ASSOCIATION"
			|| type === "CLOSED_INSIGHT"
	) {
		return true		// not handling yet
	}
};
