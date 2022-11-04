pragma solidity ^0.5.0;

contract Decentragram {
    string public name = "Decentragram";
    uint public imageCount = 0;

    struct Image {
        uint id;
        string hash;
        string description;
        uint tipAmount;
        address payable author;
    }

    event ImageCreated(
        uint id,
        string hash,
        string description,
        uint tipAmount,
        address payable author
    );

    event ImageTipped(
        uint id,
        string hash,
        string description,
        uint tipAmount,
        address payable author
    );

    mapping(uint => Image) public images;

    function uploadImage(string memory _imageHash, string memory _desc) public {
        require(bytes(_desc).length > 0);
        require(bytes(_imageHash).length > 0);
        require(msg.sender != address(0x0));

        imageCount++;
        images[imageCount] = Image(
            imageCount,
            _imageHash,
            _desc,
            0,
            msg.sender
        );

        emit ImageCreated(imageCount, _imageHash, _desc, 0, msg.sender);
    }

    function tipImageOwner(uint _id) public payable {
        require(_id > 0 && _id <= imageCount);

        Image memory _image = images[_id];
        address payable _author = _image.author;
        address(_author).transfer(msg.value);
        _image.tipAmount = _image.tipAmount + msg.value;
        images[_id] = _image;

        emit ImageTipped(
            _id,
            _image.hash,
            _image.description,
            _image.tipAmount,
            _author
        );
    }
}

// time : https://youtu.be/8rhueOcTu8k?list=PLS5SEs8ZftgVV6ah1fo2IvlHk1kTCy6un&t=3843
