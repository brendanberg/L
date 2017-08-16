/*---------------------------------------------------------------------------
	 Source -(read)-> Skeleton -(transform)-> AST
	 AST, Context -(eval)-> AST', Context'
 ---------------------------------------------------------------------------*/

let AST = require('./ast');
let I = require('immutable');
let Context = require('./context');
let Skeleton = require('./skeleton');

(function(Skel) {
	Skel.Block.prototype.transform = function(context, match) {
		// Create a new execution context for the block and recursively
		// call transform on each of the expressions in the block.

		// N.B.: Blocks are the only valid place to define a macro
		// expression. A macro defined in a block is accessible
		// anywhere in the block, so this needs two passes basically.

		let subcontext = new Context(null, context);
		let exprs = [];
		// TODO: Currently the context and match are mutable, but
		// they should probably be made immutable.

		for (let expr of this.exprs) {
			let exp = expr.transform(subcontext, match);
			if (exp) { exprs.push(exp); }
			else { return null; }
		}

		return new AST.Block({
			exprs: I.List(exprs),
			ctx: subcontext,
			tags: this.tags
		});
		// TODO: vvvvvvv
		//.transform(
			// function that bubbles errors to the top	
		//);
	};

	Skel.List.prototype.transform = function(context, match) {
		return new AST.List({
			items: this.epxrs.map(function(item) {
				return match.match(context, item.emit())
			}),
			tags: this.tags
		});
	};
	
	Skel.Message.prototype.transform = function(context, match) {
		let exprs = [];
		let type;

		for (let expr of this.exprs) {
			let exp = match.messageItem(context, expr.terms.first(), expr.terms.rest());
			if (exp) { exprs.push(exp); }
		}

		//return new 
		//	if (x && type && type === x._name

		return null;
	};
	
	Skel.Type.prototype.transform = function(context, match) {
		return null;
	};
	
	Skel.Expression.prototype.transform = function(context, match) {
		let ast = match.expression(context, this.terms.first(), this.terms.rest());

		// TODO: Reject the transform if not all terms are consumed
		// NOTE: Probably best to add the Error node in the match fn
		//       rather than the Skeleton transform.
		return ast && ast[0];
	};

	/* Note: The following two nodes are unreachable if the grammar
		 rules are correct. */

	Skel.Operator.prototype.transform = function(context, match) {
		return null; //AST.Operator
	};

	Skel.Symbol.prototype.transform = function(context, match) {
		return AST.Symbol({label: this.label, tags: this.tags});
	};

	Skel.Identifier.prototype.transform = function(context, match) {
		return AST.Identifier({
			label: this.label,
			modifier: this.modifier,
			tags: this.tags
		});
	};

	Skel.Text.prototype.transform = function(context, match) {
		return AST.Text({value: this.value, tags: this.tags});
	};

	Skel.Integer.prototype.transform = function(context, match) {
		return new AST.Integer({value: this.value, tags: this.tags});
	};

	Skel.Decimal.prototype.transform = function(context, match) {
		return AST.Decimal({
			numerator: this.numerator,
			exponent: this.exponent,
			tags: this.tags
		});
	};

	Skel.Scientific.prototype.transform = function(context, match) {
		return AST.Scientific({
			significand: this.significand,
			mantissa: this.mantissa,
			tags: this.tags
		});
	};

	Skel.Complex.prototype.transform = function(context, match) {
		return AST.Complex({
			real: this.real,
			imaginary: this.imaginary,
			tags: this.tags
		});
	};

	// TODO: Somehow attach the comment nodes to a tag node of the
	// previous AST node...

	Skel.Comment.prototype.transform = function(context, match) {
		return null;
	};
})(Skeleton);

